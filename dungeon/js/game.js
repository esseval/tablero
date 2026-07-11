import { initState }             from './state.js';
import { revealAround }          from './fog.js';
import { EVENT_HANDLERS }        from './events.js';
import { buildBoard, render, flashCell } from './renderer.js';
import { updateHUD }             from './hud.js';
import { showModal, closeModal } from '../../shared/modal.js';
import { createLog }             from '../../shared/log.js';
import { download, readJSON }    from '../../shared/storage.js';
import { roll, checkLevelUp, resolveAttackRound, rollSum } from './combat.js';

const log = createLog('log');

const OPEN_DIFFICULTY = 8;

let G            = null;
let levels       = [];
let currentIndex = 0;
let returnPos    = null;
let levelCache   = {};
let shopOpen     = false;
let chosenClass  = 'warrior';

// ── editor ──────────────────────────────────────────────────────────────────

let editorMode     = false;
let editorTile     = 'wall';
let editorEvent    = null; // null = painting tiles; non-null = placing events

export function toggleEditor() {
  editorMode = !editorMode;
  document.getElementById('editor-bar')?.classList.toggle('on', editorMode);
  if (editorMode && G) {
    const rows = G.board.map.length;
    const cols = G.board.map[0].length;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        G.visible.add(`${r},${c}`);
    G.stepsRemaining = 999;
  } else if (G) {
    revealAround(G, G.pos[0], G.pos[1], G.player.visionRange);
    G.stepsRemaining = 0;
  }
  log(editorMode ? '✏️ Editor activado' : 'Modo juego', 'sys');
  if (G) { render(G, boardEl()); updateHUD(G); }
}

export function setEditorTile(tileId) {
  editorEvent = null;
  editorTile = tileId;
}

export function setEditorEvent(type) {
  editorEvent = type;
}

function makeDefaultEvent(type) {
  switch (type) {
    case 'enemy':     return { type: 'enemy',     data: { id: 'spider', name: 'Enemy', hp: 6, maxHp: 6, atk: 3, def: 1, gold: 3, xp: 5, moveDice: 1 } };
    case 'treasure':  return { type: 'treasure',  data: { gold: 10, msg: 'Treasure! +10 gold' } };
    case 'potion':    return { type: 'potion',    data: { hp: 8, msg: 'Potion. +8 HP' } };
    case 'trap':      return { type: 'trap',      data: { dmg: 4, msg: 'Trap! -4 HP' } };
    case 'key':       return { type: 'key',       data: { keys: 1 } };
    case 'npc':       return { type: 'npc',       data: { name: 'Merchant', msg: 'Welcome.', items: [{ type: 'potion', hp: 10, price: 8, stock: 3 }] } };
    default:          return null;
  }
}

function editorClick(r, c) {
  const key = `${r},${c}`;
  if (editorEvent) {
    if (editorEvent === '__erase__') {
      delete G.events[key];
    } else {
      G.events[key] = makeDefaultEvent(editorEvent);
    }
  } else {
    G.board.map[r][c] = editorTile;
  }
  render(G, boardEl());
}

const boardEl = () => document.getElementById('board');
const logEl   = () => document.getElementById('log');

// ── shop ──────────────────────────────────────────────────────────────────

function itemLabel(item) {
  if (item.type === 'potion') return `Poción +${item.hp} HP (${item.price} oro)`;
  if (item.type === 'weapon') return `${item.name} +${item.atk} ATK (${item.price} oro)`;
  if (item.type === 'armor')  return `${item.name} +${item.def} DEF (${item.price} oro)`;
  return `${item.name} (${item.price} oro)`;
}

function buyItem(item) {
  if (G.player.gold < item.price) { log('No tenés oro suficiente.', 'danger'); return; }
  if (item.stock !== undefined) item.stock--;
  G.player.gold -= item.price;
  if (item.type === 'potion') {
    G.player.hp = Math.min(G.player.hp + item.hp, G.player.maxHp);
    log(`🧪 Compraste una poción. HP: ${G.player.hp}/${G.player.maxHp} | Oro: ${G.player.gold}`, 'ok');
  } else if (item.type === 'weapon') {
    G.player.atk += item.atk;
    log(`⚔ Compraste ${item.name}. ATK: ${G.player.atk} | Oro: ${G.player.gold}`, 'ok');
  } else if (item.type === 'armor') {
    G.player.def += item.def;
    log(`🛡 Compraste ${item.name}. DEF: ${G.player.def} | Oro: ${G.player.gold}`, 'ok');
  }
  updateHUD(G);
}

// ── dice ──────────────────────────────────────────────────────────────────

export function rollDice() {
  if (!G || G.over) return;
  if (G.stepsRemaining > 0) return;
  const n = G.player.moveDice || 1;
  let total = 0;
  const parts = [];
  for (let i = 0; i < n; i++) {
    const r = roll(1, 6);
    parts.push(r);
    total += r;
  }
  G.stepsRemaining = total;
  G.turns++;
  G.phase = 'player';
  const desc = parts.join(' + ');
  log(`🎲 ${desc}${n > 1 ? ` = ${total}` : ''} pasos (turno ${G.turns})`, 'sys');
  updateHUD(G);
  boardEl().focus();
}

// ── event dispatch ────────────────────────────────────────────────────────

function handleEvent(state, key, event) {
  const handler = EVENT_HANDLERS[event.type];
  if (!handler) return;
  const result = handler(state, key, event.data);

  if (result.lines) result.lines.forEach(l => log(l.txt, l.cls));
  if (result.msg)   log(result.msg, result.cls);
  if (result.xpGained) log(`✨ +${result.xpGained} XP`, 'loot');
  if (result.leveledUp) log(`⭐ ¡Subiste al nivel ${result.newLevel}! +2 HP máximo`, 'ok');

  if (result.cls === 'danger') flashCell(state.pos[0], state.pos[1], 'flash-dmg');
  if (result.cls === 'loot' || result.cls === 'ok') flashCell(state.pos[0], state.pos[1], 'flash-loot');

  if (result.died) { gameOver(); return; }

  if (result.shop) {
    const close = () => { shopOpen = false; boardEl().focus(); };
    const btns = result.shop.items.map(item => ({
      label: itemLabel(item), cls: 'primary', fn: () => { close(); buyItem(item); },
    }));
    btns.push({ label: 'Salir', cls: '', fn: close });
    shopOpen = true;
    showModal(result.shop.name, result.shop.msg, btns);
    return;
  }

  if (state.board.map[state.pos[0]][state.pos[1]] === 'exit') winGame();
}

// ── phases ─────────────────────────────────────────────────────────────────

function startEnemyPhase() {
  if (G.over) return;
  G.phase = 'enemy';
  G.stepsRemaining = 0;
  updateHUD(G);
  moveEnemies();
  if (G.over) { render(G, boardEl()); updateHUD(G); return; }
  render(G, boardEl());
  updateHUD(G);
  rollDice();
  boardEl().focus();
}

export function endTurn() {
  startEnemyPhase();
}

// ── move ──────────────────────────────────────────────────────────────────

export function tryMove(dr, dc) {
  if (!G || G.over) return;
  if (shopOpen) return;
  if (G.phase !== 'player') return;
  if (G.stepsRemaining <= 0) return;
  const [r, c] = G.pos;
  const nr = r + dr, nc = c + dc;
  const map = G.board.map;
  if (nr < 0 || nr >= map.length || nc < 0 || nc >= map[0].length) return;

  const tileId = map[nr][nc];
  const tile   = G.board.tileset[tileId];
  if (!tile || !tile.passable) return;

  // Enemigos y cofres bloquean el paso
  const targetEvent = G.events[`${nr},${nc}`];
  if (targetEvent?.type === 'enemy' || targetEvent?.type === 'treasure') return;

  G.pos = [nr, nc];
  G.stepsRemaining--;
  revealAround(G, nr, nc, G.player.visionRange);

  const eKey  = `${nr},${nc}`;
  const event = G.events[eKey];
  if (event) {
    handleEvent(G, eKey, event);
  } else if (tileId === 'exit') {
    winGame();
  } else if (tileId === 'entrance' && currentIndex > 0) {
    goBackLevel();
    return;
  }

  render(G, boardEl());
  updateHUD(G);

  if (G.stepsRemaining <= 0 && !G.over && !shopOpen) {
    startEnemyPhase();
  }
}

// ── lifecycle ─────────────────────────────────────────────────────────────

function winGame() {
  G.over = true;
  G.player.xp += 1;
  const leveledUp = checkLevelUp(G.player);
  if (leveledUp) log(`⭐ ¡Subiste al nivel ${G.player.level}! +2 HP máximo`, 'ok');
  updateHUD(G);

  const next = currentIndex + 1;
  if (next < levels.length) {
    showModal(
      `¡Piso ${currentIndex + 1} de ${levels.length} superado!`,
      `Avanzás al piso ${next + 1}.\n\nTurnos: ${G.turns} | Oro: ${G.player.gold} | HP: ${G.player.hp}/${G.player.maxHp} | Nivel: ${G.player.level}`,
      [{ label: `Piso ${next + 1} →`, cls: 'primary', fn: () => advanceLevel(G.player) }]
    );
  } else {
    G.won = true;
    showModal(
      '¡Victoria Total!',
      `Conquistaste los ${levels.length} pisos de la mazmorra.\n\nTurnos: ${G.turns} | Oro: ${G.player.gold} | HP: ${G.player.hp}/${G.player.maxHp} | Nivel: ${G.player.level}`,
      [{ label: 'Nueva partida', cls: 'primary', fn: () => document.dispatchEvent(new CustomEvent('restart-request')) }]
    );
  }
}

function advanceLevel(player) {
  levelCache[currentIndex] = { events: G.events };
  returnPos = [...G.pos];
  currentIndex++;
  closeModal();
  logEl().innerHTML = '';
  G = initState(levels[currentIndex], chosenClass);
  G.player = { ...player };
  revealAround(G, G.pos[0], G.pos[1], G.player.visionRange);
  buildBoard(G.board, boardEl(), onCellClick, () => G);
  render(G, boardEl());
  updateHUD(G);
  boardEl().focus();
  log(`Nivel ${currentIndex + 1}: "${G.board.meta.name}"`, 'sys');
  rollDice();
}

function goBackLevel() {
  levelCache[currentIndex] = { events: G.events };
  closeModal();
  currentIndex--;
  const prevPlayer = { ...G.player };
  logEl().innerHTML = '';
  G = initState(levels[currentIndex], chosenClass);
  if (levelCache[currentIndex]) G.events = levelCache[currentIndex].events;
  G.player = { ...prevPlayer };
  if (returnPos) G.pos = [...returnPos];
  revealAround(G, G.pos[0], G.pos[1], G.player.visionRange);
  buildBoard(G.board, boardEl(), onCellClick, () => G);
  render(G, boardEl());
  updateHUD(G);
  boardEl().focus();
  log(`Volviste al nivel ${currentIndex + 1}: "${G.board.meta.name}"`, 'sys');
  rollDice();
}

function gameOver() {
  G.over      = true;
  G.won       = false;
  G.player.hp = 0;
  updateHUD(G);
  render(G, boardEl());
  showModal(
    '¡Has muerto!',
    `La mazmorra reclamó otra víctima.\n\nTurnos: ${G.turns} | Oro acumulado: ${G.player.gold}`,
    [{ label: 'Intentar de nuevo', cls: 'danger', fn: () => document.dispatchEvent(new CustomEvent('restart-request')) }]
  );
}

export function restartGame(levelList, classId) {
  if (classId) chosenClass = classId;
  levels       = levelList;
  currentIndex = 0;
  returnPos    = null;
  levelCache   = {};
  closeModal();
  logEl().innerHTML = '';
  G = initState(levels[0], chosenClass);
  revealAround(G, G.pos[0], G.pos[1], G.player.visionRange);
  buildBoard(G.board, boardEl(), onCellClick, () => G);
  render(G, boardEl());
  updateHUD(G);
  boardEl().focus();
  log(`Bienvenido a "${G.board.meta.name}". Llegá a la salida.`, 'sys');
  rollDice();
}

// ── open (treasure) ────────────────────────────────────────────────────────

function tryOpen(dr, dc) {
  if (!G || G.over) return;
  if (shopOpen) return;
  if (G.phase !== 'player') return;
  if (G.stepsRemaining <= 0) return;
  const [r, c] = G.pos;
  const nr = r + dr, nc = c + dc;
  const key = `${nr},${nc}`;
  const event = G.events[key];
  if (!event || event.type !== 'treasure') return;
  const failure = roll(1, OPEN_DIFFICULTY) > G.player.dex + rollSum(G.player.dexDice || 1);
  if (failure) {
    log('🔒 Fallaste al abrir el cofre.', 'danger');
    render(G, boardEl());
    updateHUD(G);
    return;
  }

  const result = EVENT_HANDLERS.treasure(G, key, event.data);

  flashCell(nr, nc, 'flash-loot');

  if (result.msg) log(result.msg, result.cls);
  if (result.xpGained) log(`✨ +${result.xpGained} XP`, 'loot');
  if (result.leveledUp) log(`⭐ ¡Subiste al nivel ${result.newLevel}! +2 HP máximo`, 'ok');

  render(G, boardEl());
  updateHUD(G);
}

// ── door ───────────────────────────────────────────────────────────────────

function tryOpenDoor(dr, dc) {
  if (!G || G.over) return;
  if (shopOpen) return;
  if (G.phase !== 'player') return;
  if (G.stepsRemaining <= 0) return;
  const [r, c] = G.pos;
  const nr = r + dr, nc = c + dc;
  if (G.board.map[nr][nc] !== 'door') return;

  const failure = roll(1, OPEN_DIFFICULTY) > G.player.dex + rollSum(G.player.dexDice || 1); 
  if (failure) {
    log('🚪 La puerta está atascada. No lográs abrirla.', 'danger');
    render(G, boardEl());
    updateHUD(G);
    return;
  }

  G.board.map[nr][nc] = 'floor';
  log('🚪 Abriste la puerta.', 'ok');
  flashCell(nr, nc, 'flash-loot');

  render(G, boardEl());
  updateHUD(G);
  startEnemyPhase();
}

// ── locked door ─────────────────────────────────────────────────────────────

function tryOpenDoorLocked(dr, dc) {
  if (!G || G.over) return;
  if (shopOpen) return;
  if (G.phase !== 'player') return;
  if (G.stepsRemaining <= 0) return;
  const [r, c] = G.pos;
  const nr = r + dr, nc = c + dc;
  if (G.board.map[nr][nc] !== 'door-locked') return;
  if (G.player.keys < 1) {
    log('🔒 La puerta está cerrada con llave. Necesitás una llave.', 'danger');
    return;
  }
  G.player.keys--;
  G.board.map[nr][nc] = 'floor';
  log('🔓 Abriste la puerta con una llave.', 'ok');
  flashCell(nr, nc, 'flash-loot');
  render(G, boardEl());
  updateHUD(G);
  startEnemyPhase();
}

// ── attack ─────────────────────────────────────────────────────────────────

// Resuelve un asalto contra el enemigo en `key`. Retorna true si el jugador
// murió (y ya disparó gameOver), para que el que llama corte lo que sigue.
function resolveCombatAt(key, enemy) {
  const result = resolveAttackRound(G, enemy);
  const [er, ec] = key.split(',').map(Number);

  flashCell(er, ec, 'flash-dmg-enemy');

  if (result.playerDied || !result.died) {
    flashCell(G.pos[0], G.pos[1], 'flash-dmg');
  }

  if (result.lines) result.lines.forEach(l => log(l.txt, l.cls));
  if (result.xpGained) log(`✨ +${result.xpGained} XP`, 'loot');
  if (result.leveledUp) log(`⭐ ¡Subiste al nivel ${result.newLevel}! +2 HP máximo`, 'ok');

  if (result.died) {
    delete G.events[key];
    if (result.playerDied) { render(G, boardEl()); updateHUD(G); gameOver(); return true; }
  }
  return false;
}

function tryAttack(dr, dc) {
  if (!G || G.over) return;
  if (shopOpen) return;
  if (G.phase !== 'player') return;
  if (G.stepsRemaining <= 0) return;
  const [r, c] = G.pos;
  const nr = r + dr, nc = c + dc;
  const key = `${nr},${nc}`;
  const event = G.events[key];
  if (!event || event.type !== 'enemy') return;

  if (resolveCombatAt(key, event.data)) return;

  render(G, boardEl());
  updateHUD(G);
}

// ── enemy AI ─────────────────────────────────────────────────────────────────

// Avanza los enemigos revelados un número de pasos (moveDice) hacia el
// jugador. El que termina adyacente ataca de inmediato.
function moveEnemies() {
  const [pr, pc] = G.pos;

  for (const [startKey, ev] of Object.entries(G.events)) {
    if (ev.type !== 'enemy' || !G.revealed.has(startKey)) continue;
    if (G.events[startKey] !== ev) continue; // ya se movió a esta celda otro enemigo

    let key = startKey;
    let [er, ec] = startKey.split(',').map(Number);
    const steps = rollSum(ev.data.moveDice || 1);

    for (let i = 0; i < steps && Math.abs(pr - er) + Math.abs(pc - ec) > 1; i++) {
      const dr = Math.sign(pr - er);
      const dc = Math.sign(pc - ec);
      const nr = er + dr, nc = ec + dc;
      const newKey = `${nr},${nc}`;
      if (newKey === `${pr},${pc}`) break; // no pisa al jugador — se resuelve como ataque más abajo

      const tileId = G.board.map[nr]?.[nc];
      const tile   = G.board.tileset[tileId];
      if (!tile?.passable || G.events[newKey]) break;

      G.events[newKey] = ev;
      delete G.events[key];
      key = newKey; er = nr; ec = nc;
    }

    if (Math.abs(pr - er) + Math.abs(pc - ec) === 1) {
      if (resolveCombatAt(key, ev.data)) return;
    }
  }
}

// ── search ─────────────────────────────────────────────────────────────────

export function trySearch() {
  if (!G || G.over) return;
  if (shopOpen) return;
  if (G.phase !== 'player') return;
  if (G.stepsRemaining <= 0) return;

  const found = [];
  for (const key of G.visible) {
    const event = G.events[key];
    if (!event || (event.type !== 'potion' && event.type !== 'trap')) continue;
    if (G.searched.has(key)) continue;
    if (roll(1, 8) > G.player.dex + rollSum(G.player.dexDice || 1)) continue;
    G.searched.add(key);
    found.push(event.type === 'potion' ? 'una poción' : 'una trampa');
  }

  if (found.length === 0) {
    log('🔍 No encontraste nada.', 'sys');
  } else {
    log(`🔍 ¡Encontraste ${found.join(', ')}!`, 'ok');
  }

  render(G, boardEl());
  updateHUD(G);
  startEnemyPhase();
}

// ── input (click) ─────────────────────────────────────────────────────────

function onCellClick(r, c) {
  if (!G || G.over) return;
  if (shopOpen) return;
  if (editorMode) { editorClick(r, c); return; }
  const [pr, pc] = G.pos;
  const dr = r - pr, dc = c - pc;
  if (Math.abs(dr) + Math.abs(dc) !== 1) return;

  const key = `${r},${c}`;
  const ev = G.events[key];
  if (ev?.type === 'enemy') {
    tryAttack(dr, dc);
  } else if (ev?.type === 'treasure') {
    tryOpen(dr, dc);
  } else if (G.board.map[r][c] === 'door') {
    tryOpenDoor(dr, dc);
  } else if (G.board.map[r][c] === 'door-locked') {
    tryOpenDoorLocked(dr, dc);
  } else {
    tryMove(dr, dc);
  }
}

// ── I/O ───────────────────────────────────────────────────────────────────

export function exportBoard() {
  levels[currentIndex].events = { ...G.events };
  download(JSON.stringify(levels[currentIndex], null, 2), 'tablero.json', 'application/json');
}

export function importBoard(evt) {
  readJSON(evt, (data, err) => {
    if (err) { log(err, 'danger'); return; }
    restartGame([data]);
    log('Tablero importado: ' + (data.meta?.name || 'sin nombre'), 'sys');
  });
}
