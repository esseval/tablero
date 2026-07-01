import { initState }             from './state.js';
import { revealAround }          from './fog.js';
import { EVENT_HANDLERS }        from './events.js';
import { buildBoard, render }    from './renderer.js';
import { updateHUD }             from './hud.js';
import { showModal, closeModal } from '../../shared/modal.js';
import { createLog }             from '../../shared/log.js';
import { download, readJSON }    from '../../shared/storage.js';
import { roll, checkLevelUp, resolveAttackRound } from './combat.js';

const log = createLog('log');

let G            = null;
let levels       = [];
let currentIndex = 0;
let returnPos    = null;
let levelCache   = {};
let shopOpen     = false;

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
  const desc = parts.join(' + ');
  log(`🎲 ${desc}${n > 1 ? ` = ${total}` : ''} pasos (turno ${G.turns})`, 'sys');
  updateHUD(G);
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

// ── move ──────────────────────────────────────────────────────────────────

export function tryMove(dr, dc) {
  if (!G || G.over) return;
  if (shopOpen) return;
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

  if (G.stepsRemaining <= 0 && !G.over && !G.won) {
    rollDice();
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
      `¡Nivel ${currentIndex + 1} superado!`,
      `Avanzás al nivel ${next + 1}.\n\nTurnos: ${G.turns} | Oro: ${G.player.gold} | HP: ${G.player.hp}/${G.player.maxHp} | Nivel: ${G.player.level}`,
      [{ label: `Nivel ${next + 1} →`, cls: 'primary', fn: () => advanceLevel(G.player) }]
    );
  } else {
    G.won = true;
    showModal(
      '¡Victoria Total!',
      `Conquistaste la mazmorra completa.\n\nTurnos: ${G.turns} | Oro: ${G.player.gold} | HP: ${G.player.hp}/${G.player.maxHp} | Nivel: ${G.player.level}`,
      [{ label: 'Nueva partida', cls: 'primary', fn: () => restartGame(levels) }]
    );
  }
}

function advanceLevel(player) {
  levelCache[currentIndex] = { events: G.events };
  returnPos = [...G.pos];
  currentIndex++;
  closeModal();
  logEl().innerHTML = '';
  G = initState(levels[currentIndex]);
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
  G = initState(levels[currentIndex]);
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
    [{ label: 'Intentar de nuevo', cls: 'danger', fn: () => restartGame(levels) }]
  );
}

export function restartGame(levelList) {
  levels       = levelList;
  currentIndex = 0;
  returnPos    = null;
  levelCache   = {};
  closeModal();
  logEl().innerHTML = '';
  G = initState(levels[0]);
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
  const [r, c] = G.pos;
  const nr = r + dr, nc = c + dc;
  const key = `${nr},${nc}`;
  const event = G.events[key];
  if (!event || event.type !== 'treasure') return;

  // TODO: calcular probabilidad según player.openChance
  const success = true;

  if (!success) {
    log('🔒 Fallaste al abrir el cofre.', 'danger');
    render(G, boardEl());
    updateHUD(G);
    return;
  }

  const result = EVENT_HANDLERS.treasure(G, key, event.data);

  if (result.msg) log(result.msg, result.cls);
  if (result.xpGained) log(`✨ +${result.xpGained} XP`, 'loot');
  if (result.leveledUp) log(`⭐ ¡Subiste al nivel ${result.newLevel}! +2 HP máximo`, 'ok');

  render(G, boardEl());
  updateHUD(G);
}

// ── attack ─────────────────────────────────────────────────────────────────

function tryAttack(dr, dc) {
  if (!G || G.over) return;
  if (shopOpen) return;
  const [r, c] = G.pos;
  const nr = r + dr, nc = c + dc;
  const key = `${nr},${nc}`;
  const event = G.events[key];
  if (!event || event.type !== 'enemy') return;

  const result = resolveAttackRound(G, event.data);

  if (result.lines) result.lines.forEach(l => log(l.txt, l.cls));
  if (result.xpGained) log(`✨ +${result.xpGained} XP`, 'loot');
  if (result.leveledUp) log(`⭐ ¡Subiste al nivel ${result.newLevel}! +2 HP máximo`, 'ok');

  if (result.died) {
    if (result.playerDied) { delete G.events[key]; render(G, boardEl()); updateHUD(G); gameOver(); return; }
    delete G.events[key];
  }

  render(G, boardEl());
  updateHUD(G);
}

// ── input (click) ─────────────────────────────────────────────────────────

function onCellClick(r, c) {
  if (!G || G.over) return;
  if (shopOpen) return;
  const [pr, pc] = G.pos;
  const dr = r - pr, dc = c - pc;
  if (Math.abs(dr) + Math.abs(dc) !== 1) return;

  const key = `${r},${c}`;
  const ev = G.events[key];
  if (ev?.type === 'enemy') {
    tryAttack(dr, dc);
  } else if (ev?.type === 'treasure') {
    tryOpen(dr, dc);
  } else {
    tryMove(dr, dc);
  }
}

// ── I/O ───────────────────────────────────────────────────────────────────

export function exportBoard() {
  download(JSON.stringify(levels[currentIndex], null, 2), 'tablero.json', 'application/json');
}

export function importBoard(evt) {
  readJSON(evt, (data, err) => {
    if (err) { log(err, 'danger'); return; }
    restartGame([data]);
    log('Tablero importado: ' + (data.meta?.name || 'sin nombre'), 'sys');
  });
}
