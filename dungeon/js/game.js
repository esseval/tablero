/** Radio de celdas visibles alrededor del jugador (niebla de guerra). */
const FOG_RADIUS = 2;

/** @type {Object[]} Lista ordenada de niveles cargados dinámicamente. */
let LEVELS = [];
let currentLevelIndex = 0;
/** @type {Object|null} Datos del nivel activo. */
let BOARD_DATA = null;

/**
 * Construye el array LEVELS leyendo todas las variables globales LEVEL1, LEVEL2, …
 * en orden numérico. Se llama cada vez que se reinicia la partida para incorporar
 * niveles cargados después del arranque inicial.
 */
function buildLevels() {
  LEVELS = Object.keys(window)
    .filter(k => /^LEVEL\d+$/.test(k))
    .sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5)))
    .map(k => window[k]);
}

// ─────────────────────────────────────────────
//  GAME STATE
// ─────────────────────────────────────────────

/** @type {Object|null} Estado completo de la partida en curso. */
let G = null;

/**
 * Crea y devuelve el estado inicial de la partida a partir de los datos de un nivel.
 * @param {Object} boardData - Definición del nivel (meta, tileset, map, events).
 * @returns {Object} Estado fresco: jugador, posición, turnos, eventos, conjuntos de visibilidad.
 */
function initState(boardData) {
  const m = boardData.meta;
  return {
    board: boardData,
    player: { ...m.player },
    pos: [...m.startPos],
    turns: 0,
    events: { ...boardData.events },
    visited: new Set(),
    revealed: new Set(),
    over: false,
    won: false
  };
}

// ─────────────────────────────────────────────
//  FOG OF WAR
// ─────────────────────────────────────────────

/**
 * Marca la celda actual como visitada y expande el área revelada
 * en un cuadrado de radio FOG_RADIUS alrededor de ella.
 * @param {Object} state - Estado de la partida.
 * @param {number} r - Fila del jugador.
 * @param {number} c - Columna del jugador.
 */
function revealAround(state, r, c) {
  const key = r + ',' + c;
  state.visited.add(key);
  for (let dr = -FOG_RADIUS; dr <= FOG_RADIUS; dr++) {
    for (let dc = -FOG_RADIUS; dc <= FOG_RADIUS; dc++) {
      state.revealed.add((r+dr) + ',' + (c+dc));
    }
  }
}

// ─────────────────────────────────────────────
//  COMBAT
// ─────────────────────────────────────────────

/**
 * Devuelve un entero aleatorio entre min y max (ambos inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function roll(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

/**
 * Resuelve un combate por turnos entre el jugador y un enemigo.
 * El jugador siempre ataca primero. Modifica hp del jugador y del enemigo.
 * Si el jugador gana, acumula el oro del enemigo.
 * @param {Object} state - Estado de la partida.
 * @param {Object} enemy - Copia mutable del enemigo con hp, atk, def, gold, name.
 * @returns {{ won: boolean, lines: Array<{cls: string, txt: string}> }}
 */
function resolveCombat(state, enemy) {
  const p = state.player;
  const lines = [];
  lines.push({ cls:'sys', txt:`⚔ Encuentro: ${enemy.name} (HP:${enemy.hp} ATK:${enemy.atk} DEF:${enemy.def})` });

  while (enemy.hp > 0 && p.hp > 0) {
    const pDmg = Math.max(0, (p.atk + roll(1, 5)) - enemy.def);
    enemy.hp -= pDmg;
    lines.push({ cls:'combat', txt:`  Tu ataque: ${pDmg} daño → ${enemy.name} HP: ${Math.max(0,enemy.hp)}` });
    if (enemy.hp <= 0) break;

    const eDmg = Math.max(0, (enemy.atk + roll(0, 3)) - p.def);
    p.hp -= eDmg;
    lines.push({ cls:'combat', txt:`  ${enemy.name} ataca: ${eDmg} daño → Tu HP: ${Math.max(0,p.hp)}` });
  }

  if (p.hp > 0) {
    p.gold += enemy.gold;
    lines.push({ cls:'loot', txt:`✓ Derrotaste a ${enemy.name}. +${enemy.gold} oro` });
    return { won: true, lines };
  } else {
    lines.push({ cls:'dead', txt:`✗ Fuiste derrotado por ${enemy.name}.` });
    return { won: false, lines };
  }
}

// ─────────────────────────────────────────────
//  MOVE LOGIC
// ─────────────────────────────────────────────

/**
 * Intenta mover al jugador un paso en la dirección indicada.
 * Valida límites del mapa y pasabilidad del tile. Si el movimiento es válido,
 * actualiza la posición, incrementa el contador de turnos, expande la niebla
 * y dispara el evento del tile destino si existe.
 * @param {Object} state - Estado de la partida.
 * @param {number} dr - Delta fila (-1, 0 o 1).
 * @param {number} dc - Delta columna (-1, 0 o 1).
 */
function tryMove(state, dr, dc) {
  if (state.over) return;
  const [r, c] = state.pos;
  const nr = r + dr, nc = c + dc;
  const map = state.board.map;
  if (nr < 0 || nr >= map.length || nc < 0 || nc >= map[0].length) return;

  const tileId = map[nr][nc];
  const tile = state.board.tileset[tileId];
  if (!tile || !tile.passable) return;

  state.pos = [nr, nc];
  state.turns++;
  revealAround(state, nr, nc);

  const eKey = nr + ',' + nc;
  const event = state.events[eKey];
  if (event) {
    handleEvent(state, eKey, event);
  } else if (tileId === 'exit') {
    winGame(state);
  }

  render();
  updateHUD();
}

// ─────────────────────────────────────────────
//  EVENT HANDLERS
// ─────────────────────────────────────────────

/**
 * Tabla de handlers por tipo de evento. Cada función recibe (state, key, data)
 * y devuelve true si la partida terminó (para que handleEvent no continúe).
 */
const EVENT_HANDLERS = {
  enemy(state, key, data) {
    const result = resolveCombat(state, { ...data });
    result.lines.forEach(l => log(l.txt, l.cls));
    delete state.events[key];
    if (!result.won) { gameOver(state); return true; }
  },
  treasure(state, key, data) {
    state.player.gold += data.gold;
    log('💰 ' + data.msg, 'loot');
    delete state.events[key];
  },
  potion(state, key, data) {
    const p = state.player;
    p.hp += Math.min(data.hp, p.maxHp - p.hp);
    log('🧪 ' + data.msg + ` (HP: ${p.hp}/${p.maxHp})`, 'ok');
    delete state.events[key];
  },
  trap(state, key, data) {
    const p = state.player;
    p.hp -= data.dmg;
    log('🩸 ' + data.msg + ` (HP: ${Math.max(0,p.hp)}/${p.maxHp})`, 'danger');
    delete state.events[key];
    if (p.hp <= 0) { gameOver(state); return true; }
  },
  npc(state, key, data) {
    const btns = data.items.map(item => ({
      label: itemLabel(item),
      cls: 'primary',
      fn: () => buyItem(state, item),
    }));
    btns.push({ label: 'Salir', cls: '', fn: () => {} });
    showModal(data.name, data.msg, btns);
  },
};

/**
 * Despacha el evento de una celda al handler correspondiente y,
 * si la partida sigue en curso, verifica si el tile es la salida.
 * @param {Object} state - Estado de la partida.
 * @param {string} key - Clave "fila,columna" del tile.
 * @param {Object} event - Objeto evento con type y data.
 */
function handleEvent(state, key, event) {
  const handler = EVENT_HANDLERS[event.type];
  if (!handler) return;
  if (handler(state, key, event.data)) return;
  if (state.board.map[state.pos[0]][state.pos[1]] === 'exit') winGame(state);
}

/**
 * Gestiona el fin de un nivel. Si hay niveles siguientes muestra el modal
 * de transición; si era el último, muestra la victoria final.
 * @param {Object} state - Estado de la partida.
 */
function winGame(state) {
  state.over = true;
  const next = currentLevelIndex + 1;
  if (next < LEVELS.length) {
    showModal(
      `¡Nivel ${currentLevelIndex + 1} superado!`,
      `Avanzás al nivel ${next + 1}.\n\nTurnos: ${state.turns} | Oro: ${state.player.gold} | HP: ${state.player.hp}/${state.player.maxHp}`,
      [{ label: `Nivel ${next + 1} →`, cls: 'primary', fn: () => advanceLevel(state.player) }]
    );
  } else {
    state.won = true;
    showModal(
      '¡Victoria Total!',
      `Conquistaste la mazmorra completa.\n\nTurnos: ${state.turns} | Oro: ${state.player.gold} | HP: ${state.player.hp}/${state.player.maxHp}`,
      [{ label: 'Nueva partida', cls: 'primary', fn: restartGame }]
    );
  }
}

/**
 * Carga el siguiente nivel conservando los stats del jugador (hp, gold, atk, def).
 * @param {Object} player - Stats del jugador al terminar el nivel anterior.
 */
function advanceLevel(player) {
  currentLevelIndex++;
  BOARD_DATA = LEVELS[currentLevelIndex];
  closeModal();
  document.getElementById('log').innerHTML = '';
  G = initState(BOARD_DATA);
  G.player = { ...player };
  revealAround(G, G.pos[0], G.pos[1]);
  buildBoard();
  render();
  updateHUD();
  document.getElementById('board').focus();
  log(`Nivel ${currentLevelIndex + 1}: "${G.board.meta.name}"`, 'sys');
  log('Usá WASD / flechas o hacé click en una casilla adyacente para moverte.', 'sys');
}

/**
 * Finaliza la partida por muerte del jugador y muestra el modal de game over.
 * @param {Object} state - Estado de la partida.
 */
function gameOver(state) {
  state.over = true; state.won = false;
  state.player.hp = 0;
  updateHUD();
  render();
  showModal(
    '¡Has muerto!',
    `La mazmorra reclamó otra víctima.\n\nTurnos: ${state.turns} | Oro acumulado: ${state.player.gold}`,
    [{ label:'Intentar de nuevo', cls:'danger', fn: restartGame }]
  );
}

/**
 * Genera la etiqueta del botón de compra según el tipo de ítem.
 * @param {{ type: string, price: number, hp?: number, atk?: number, name?: string }} item
 * @returns {string}
 */
function itemLabel(item) {
  if (item.type === 'potion') return `Poción +${item.hp} HP (${item.price} oro)`;
  if (item.type === 'weapon') return `${item.name} +${item.atk} ATK (${item.price} oro)`;
  return `${item.name} (${item.price} oro)`;
}

/**
 * Procesa la compra de un ítem al NPC. Descuenta el oro y aplica el efecto
 * correspondiente al jugador. Registra error si no hay fondos suficientes.
 * @param {Object} state - Estado de la partida.
 * @param {{ type: string, price: number, hp?: number, atk?: number, name?: string }} item
 */
function buyItem(state, item) {
  if (state.player.gold < item.price) {
    log('No tenés oro suficiente.', 'danger');
    return;
  }
  state.player.gold -= item.price;
  if (item.type === 'potion') {
    state.player.hp += Math.min(item.hp, state.player.maxHp - state.player.hp);
    log(`🧪 Compraste una poción. HP: ${state.player.hp}/${state.player.maxHp} | Oro: ${state.player.gold}`, 'ok');
  } else if (item.type === 'weapon') {
    state.player.atk += item.atk;
    log(`⚔ Compraste ${item.name}. ATK: ${state.player.atk} | Oro: ${state.player.gold}`, 'ok');
  }
  updateHUD();
}

// ─────────────────────────────────────────────
//  RENDERER
// ─────────────────────────────────────────────

/**
 * Construye la grilla DOM del tablero para el nivel activo.
 * Crea una celda <div> por tile y registra el listener de click.
 */
function buildBoard() {
  const board = document.getElementById('board');
  const rows = BOARD_DATA.map.length;
  const cols = BOARD_DATA.map[0].length;
  board.style.gridTemplateColumns = `repeat(${cols}, 52px)`;
  board.style.gridTemplateRows    = `repeat(${rows}, 52px)`;
  board.innerHTML = '';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell fog';
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.addEventListener('click', onCellClick);
      board.appendChild(cell);
    }
  }
}

/**
 * Devuelve el elemento DOM de la celda en la posición (r, c).
 * @param {number} r - Fila.
 * @param {number} c - Columna.
 * @returns {Element|null}
 */
function cellEl(r, c) {
  return document.querySelector(`#board .cell[data-r="${r}"][data-c="${c}"]`);
}

/**
 * Recorre todas las celdas y actualiza su clase CSS e innerHTML según el
 * estado de visibilidad (fog / dim / visible) y la presencia del jugador
 * o un evento en esa posición.
 */
function render() {
  if (!G) return;
  const rows = G.board.map.length;
  const cols = G.board.map[0].length;
  const [pr, pc] = G.pos;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = r + ',' + c;
      const el = cellEl(r, c);
      if (!el) continue;

      el.className = 'cell';
      const tileId = G.board.map[r][c];
      const tile   = G.board.tileset[tileId];

      if (!G.revealed.has(key)) {
        el.className += ' fog';
        el.innerHTML  = '';
        continue;
      }

      if (!G.visited.has(key)) {
        el.className += ' dim';
      }

      if (tile && !tile.passable) el.className += ' wall';

      const assetId = tile ? tile.asset : 'floor';
      el.innerHTML = `<img class="cell-bg" src="assets/${assetId}.svg" alt="">`;

      if (r === pr && c === pc) {
        el.innerHTML += `<div class="cell-entity"><img src="assets/player.svg" alt="Jugador"></div>`;
      } else {
        const ev = G.events[key];
        if (ev && G.revealed.has(key)) {
          const entityId = getEventAssetId(ev);
          if (entityId) {
            el.innerHTML += `<div class="cell-entity"><img src="assets/${entityId}.svg" alt="${ev.type}"></div>`;
          }
        }
      }
    }
  }
}

/**
 * Devuelve el nombre del archivo SVG (sin extensión) que corresponde a un evento.
 * @param {Object} ev - Evento con type y data.
 * @returns {string|null} ID del asset o null si el tipo no tiene representación visual.
 */
function getEventAssetId(ev) {
  if (ev.type === 'enemy')    return ev.data.id;
  if (ev.type === 'treasure') return 'treasure';
  if (ev.type === 'potion')   return 'potion';
  if (ev.type === 'trap')     return 'trap';
  if (ev.type === 'npc')      return 'npc';
  return null;
}

// ─────────────────────────────────────────────
//  HUD
// ─────────────────────────────────────────────

/**
 * Sincroniza los valores del HUD (HP, ATK, DEF, oro, turnos y barra de vida)
 * con el estado actual del jugador.
 */
function updateHUD() {
  if (!G) return;
  const p = G.player;
  document.getElementById('stat-hp-val').textContent   = `${Math.max(0,p.hp)}/${p.maxHp}`;
  document.getElementById('stat-atk-val').textContent  = p.atk;
  document.getElementById('stat-def-val').textContent  = p.def;
  document.getElementById('stat-gold-val').textContent = p.gold;
  document.getElementById('stat-turns-val').textContent= G.turns;
  const pct = Math.max(0, (p.hp / p.maxHp) * 100);
  document.getElementById('bar-hp').style.width = pct + '%';
}

// ─────────────────────────────────────────────
//  LOG
// ─────────────────────────────────────────────

/**
 * Agrega una línea al panel de log y hace scroll al final.
 * @param {string} txt - Texto a mostrar.
 * @param {string} [cls='le'] - Clase CSS que define el color (combat, loot, ok, danger, sys, dead).
 */
function log(txt, cls = 'le') {
  const el = document.getElementById('log');
  const div = document.createElement('div');
  div.className = 'le ' + cls;
  div.textContent = txt;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

// ─────────────────────────────────────────────
//  INPUT
// ─────────────────────────────────────────────

document.getElementById('board').addEventListener('keydown', e => {
  const map = { ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1],
                w:[-1,0], s:[1,0], a:[0,-1], d:[0,1],
                W:[-1,0], S:[1,0], A:[0,-1], D:[0,1] };
  const dir = map[e.key];
  if (dir) { e.preventDefault(); tryMove(G, dir[0], dir[1]); }
});

/**
 * Maneja el click en una celda del tablero. Solo acepta celdas adyacentes
 * (distancia Manhattan = 1) a la posición actual del jugador.
 * @param {MouseEvent} e
 */
function onCellClick(e) {
  if (!G || G.over) return;
  const r = +e.currentTarget.dataset.r;
  const c = +e.currentTarget.dataset.c;
  const [pr, pc] = G.pos;
  const dr = r - pr, dc = c - pc;
  if (Math.abs(dr) + Math.abs(dc) === 1) tryMove(G, dr, dc);
}

// ─────────────────────────────────────────────
//  MODAL
// ─────────────────────────────────────────────

/**
 * Muestra el modal con título, cuerpo y una lista de botones de acción.
 * @param {string} title - Título del modal.
 * @param {string} body - Texto descriptivo.
 * @param {Array<{label: string, cls: string, fn: Function}>} btns - Botones a renderizar.
 */
function showModal(title, body, btns) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').textContent  = body;
  const cont = document.getElementById('modal-btns');
  cont.innerHTML = '';
  btns.forEach(b => {
    const btn = document.createElement('button');
    btn.textContent = b.label;
    if (b.cls) btn.className = b.cls;
    btn.onclick = () => { closeModal(); b.fn(); };
    cont.appendChild(btn);
  });
  document.getElementById('overlay').classList.add('on');
}

/** Oculta el modal activo. */
function closeModal() { document.getElementById('overlay').classList.remove('on'); }

// ─────────────────────────────────────────────
//  IMPORT / EXPORT
// ─────────────────────────────────────────────

/** Descarga el nivel activo como archivo JSON. */
function exportBoard() {
  const json = JSON.stringify(BOARD_DATA, null, 2);
  download(json, 'tablero.json', 'application/json');
}

/**
 * Importa un nivel desde un archivo JSON seleccionado por el usuario
 * y reinicia la partida con él.
 * @param {Event} evt - Evento change del input file.
 */
function importBoard(evt) {
  readJSON(evt, data => {
    BOARD_DATA = data;
    restartGame();
    log('Tablero importado: ' + (data.meta?.name || 'sin nombre'), 'sys');
  });
}

/**
 * Lee el primer archivo del input, lo parsea como JSON y llama al callback.
 * Registra un error en el log si el JSON es inválido.
 * @param {Event} evt - Evento change del input file.
 * @param {Function} cb - Callback que recibe el objeto parseado.
 */
function readJSON(evt, cb) {
  const file = evt.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = e => { try { cb(JSON.parse(e.target.result)); } catch { log('Error: JSON inválido', 'danger'); } };
  r.readAsText(file);
  evt.target.value = '';
}

/**
 * Crea un enlace de descarga temporal y lo activa.
 * @param {string} content - Contenido del archivo.
 * @param {string} filename - Nombre del archivo a descargar.
 * @param {string} type - MIME type del archivo.
 */
function download(content, filename, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────

/**
 * Reinicia la partida desde el nivel 1, reseteando todo el estado.
 * Reconstruye el array LEVELS para incorporar cualquier nivel cargado
 * dinámicamente desde el último inicio.
 */
function restartGame() {
  closeModal();
  buildLevels();
  currentLevelIndex = 0;
  BOARD_DATA = LEVELS[0];
  document.getElementById('log').innerHTML = '';
  G = initState(BOARD_DATA);
  revealAround(G, G.pos[0], G.pos[1]);
  buildBoard();
  render();
  updateHUD();
  document.getElementById('board').focus();
  log(`Bienvenido a "${G.board.meta.name}". Llegá a la salida.`, 'sys');
  log('Usá WASD / flechas o hacé click en una casilla adyacente para moverte.', 'sys');
}
