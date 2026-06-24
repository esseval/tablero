import { initState }             from './state.js';
import { revealAround }          from './fog.js';
import { EVENT_HANDLERS }        from './events.js';
import { buildBoard, render }    from './renderer.js';
import { updateHUD }             from './hud.js';
import { showModal, closeModal } from '../../shared/modal.js';
import { createLog }             from '../../shared/log.js';
import { download, readJSON }    from '../../shared/storage.js';

const log = createLog('log');

let G            = null;
let levels       = [];
let currentIndex = 0;
let returnPos    = null;

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

// ── event dispatch ────────────────────────────────────────────────────────

function handleEvent(state, key, event) {
  const handler = EVENT_HANDLERS[event.type];
  if (!handler) return;
  const result = handler(state, key, event.data);

  if (result.lines) result.lines.forEach(l => log(l.txt, l.cls));
  if (result.msg)   log(result.msg, result.cls);

  if (result.died) { gameOver(); return; }

  if (result.shop) {
    const btns = result.shop.items.map(item => ({
      label: itemLabel(item), cls: 'primary', fn: () => buyItem(item),
    }));
    btns.push({ label: 'Salir', cls: '', fn: () => {} });
    showModal(result.shop.name, result.shop.msg, btns);
    return;
  }

  if (state.board.map[state.pos[0]][state.pos[1]] === 'exit') winGame();
}

// ── move ──────────────────────────────────────────────────────────────────

export function tryMove(dr, dc) {
  if (!G || G.over) return;
  const [r, c] = G.pos;
  const nr = r + dr, nc = c + dc;
  const map = G.board.map;
  if (nr < 0 || nr >= map.length || nc < 0 || nc >= map[0].length) return;

  const tileId = map[nr][nc];
  const tile   = G.board.tileset[tileId];
  if (!tile || !tile.passable) return;

  G.pos = [nr, nc];
  G.turns++;
  revealAround(G, nr, nc);

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
}

// ── lifecycle ─────────────────────────────────────────────────────────────

function winGame() {
  G.over    = true;
  const next = currentIndex + 1;
  if (next < levels.length) {
    showModal(
      `¡Nivel ${currentIndex + 1} superado!`,
      `Avanzás al nivel ${next + 1}.\n\nTurnos: ${G.turns} | Oro: ${G.player.gold} | HP: ${G.player.hp}/${G.player.maxHp}`,
      [{ label: `Nivel ${next + 1} →`, cls: 'primary', fn: () => advanceLevel(G.player) }]
    );
  } else {
    G.won = true;
    showModal(
      '¡Victoria Total!',
      `Conquistaste la mazmorra completa.\n\nTurnos: ${G.turns} | Oro: ${G.player.gold} | HP: ${G.player.hp}/${G.player.maxHp}`,
      [{ label: 'Nueva partida', cls: 'primary', fn: () => restartGame(levels) }]
    );
  }
}

function advanceLevel(player) {
  returnPos = [...G.pos];
  currentIndex++;
  closeModal();
  logEl().innerHTML = '';
  G = initState(levels[currentIndex]);
  G.player = { ...player };
  revealAround(G, G.pos[0], G.pos[1]);
  buildBoard(G.board, boardEl(), onCellClick);
  render(G, boardEl());
  updateHUD(G);
  boardEl().focus();
  log(`Nivel ${currentIndex + 1}: "${G.board.meta.name}"`, 'sys');
  log('Usá WASD / flechas o hacé click en una casilla adyacente para moverte.', 'sys');
}

function goBackLevel() {
  closeModal();
  currentIndex--;
  const prevPlayer = { ...G.player };
  logEl().innerHTML = '';
  G = initState(levels[currentIndex]);
  G.player = { ...prevPlayer };
  if (returnPos) G.pos = [...returnPos];
  revealAround(G, G.pos[0], G.pos[1]);
  buildBoard(G.board, boardEl(), onCellClick);
  render(G, boardEl());
  updateHUD(G);
  boardEl().focus();
  log(`Volviste al nivel ${currentIndex + 1}: "${G.board.meta.name}"`, 'sys');
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
  closeModal();
  logEl().innerHTML = '';
  G = initState(levels[0]);
  revealAround(G, G.pos[0], G.pos[1]);
  buildBoard(G.board, boardEl(), onCellClick);
  render(G, boardEl());
  updateHUD(G);
  boardEl().focus();
  log(`Bienvenido a "${G.board.meta.name}". Llegá a la salida.`, 'sys');
  log('Usá WASD / flechas o hacé click en una casilla adyacente para moverte.', 'sys');
}

// ── input (click) ─────────────────────────────────────────────────────────

function onCellClick(r, c) {
  if (!G || G.over) return;
  const [pr, pc] = G.pos;
  const dr = r - pr, dc = c - pc;
  if (Math.abs(dr) + Math.abs(dc) === 1) tryMove(dr, dc);
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
