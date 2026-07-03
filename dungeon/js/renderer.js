function cellEl(r, c) {
  return document.querySelector(`#board .cell[data-r="${r}"][data-c="${c}"]`);
}

export function getEventAssetId(ev) {
  if (ev.type === 'enemy')    return ev.data.id;
  if (ev.type === 'treasure') return 'treasure';
  if (ev.type === 'potion')   return 'potion';
  if (ev.type === 'trap')     return 'trap';
  if (ev.type === 'npc')      return 'npc';
  return null;
}

export function buildBoard(boardData, container, onCellClick, getState) {
  const rows = boardData.map.length;
  const cols = boardData.map[0].length;
  container.style.gridTemplateColumns = `repeat(${cols}, 52px)`;
  container.style.gridTemplateRows    = `repeat(${rows}, 52px)`;
  container.innerHTML = '';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell fog';
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.addEventListener('click', () => onCellClick(r, c));
      cell.addEventListener('mouseenter', () => {
        if (!getState) return;
        const st = getState();
        if (!st) return;
        const key = `${r},${c}`;
        // Tooltip solo en celdas actualmente visibles (no en las que ya no se ven)
        if (!st.visible?.has(key)) return;
        const ev = st.events?.[key];
        if (!ev) return;
        if (ev.type === 'enemy') {
          cell.title = `${ev.data.name} | HP: ${ev.data.hp} ATK: ${ev.data.atk} DEF: ${ev.data.def}`;
        } else if (ev.type === 'npc') {
          cell.title = ev.data.name;
        }
      });
      container.appendChild(cell);
    }
  }
}

export function render(state, container) {
  const rows    = state.board.map.length;
  const cols    = state.board.map[0].length;
  const [pr, pc] = state.pos;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const el  = cellEl(r, c);
      if (!el) continue;

      el.className = 'cell';
      const tileId = state.board.map[r][c];
      const tile   = state.board.tileset[tileId];

      // Si la celda no está en el cono de visión actual → niebla total
      // (a diferencia de state.revealed, state.visible se recalcula en cada turno)
      if (!state.visible.has(key)) {
        el.className += ' fog';
        el.innerHTML  = '';   // Elimina entidades, fondo, todo
        continue;             // Salta el render del contenido
      }

      const dist = state.dim.get(key);
      if (dist !== undefined) {
        const dimFactor = (dist - 1) * 0.35;
        el.style.setProperty('--entity-opacity', 1 - dimFactor);
        el.style.setProperty('--overlay-opacity', dimFactor);
        el.className += ' dim';
      }

      if (tile && !tile.passable)  el.className += ' wall';

      const assetId = tile ? tile.asset : 'floor';
      el.innerHTML = `<img class="cell-bg" src="assets/${assetId}.png" alt="">`;

      if (r === pr && c === pc) {
        el.innerHTML += `<div class="cell-entity"><img src="assets/player.png" alt="Jugador"></div>`;
      } else {
        const ev = state.events[key];
        if (ev) {
          // Trap/potion ocultos hasta que la acción Buscar los revele
          if ((ev.type === 'potion' || ev.type === 'trap') && !state.searched.has(key)) {
            // no renderizar entidad
          } else {
            const entityId = getEventAssetId(ev);
            if (entityId) {
              el.innerHTML += `<div class="cell-entity"><img src="assets/${entityId}.png" alt="${ev.type}"></div>`;
            }
          }
        }
      }
    }
  }

  renderMinimap(state);
}

function renderMinimap(state) {
  const canvas = document.getElementById('minimap');
  if (!canvas) return;
  const rows = state.board.map.length;
  const cols = state.board.map[0].length;
  canvas.width  = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d');
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      if (!state.revealed.has(key)) {
        ctx.fillStyle = '#000';
      } else if (state.board.map[r][c] === 'wall') {
        ctx.fillStyle = '#4a3828';
      } else if (state.board.map[r][c] === 'exit') {
        ctx.fillStyle = '#1a9a3a';
      } else {
        ctx.fillStyle = '#2a2a2a';
      }
      ctx.fillRect(c, r, 1, 1);
    }
  }
  ctx.fillStyle = '#4a90d9';
  ctx.fillRect(state.pos[1], state.pos[0], 1, 1);
}
