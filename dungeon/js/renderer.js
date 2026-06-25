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
        if (!st.revealed?.has(key)) return;
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

      if (!state.revealed.has(key)) {
        el.className += ' fog';
        el.innerHTML  = '';
        continue;
      }

      if (!state.visited.has(key)) el.className += ' dim';
      if (tile && !tile.passable)  el.className += ' wall';

      const assetId = tile ? tile.asset : 'floor';
      el.innerHTML = `<img class="cell-bg" src="assets/${assetId}.svg" alt="">`;

      if (r === pr && c === pc) {
        el.innerHTML += `<div class="cell-entity"><img src="assets/player.svg" alt="Jugador"></div>`;
      } else {
        const ev = state.events[key];
        if (ev) {
          const entityId = getEventAssetId(ev);
          if (entityId) {
            el.innerHTML += `<div class="cell-entity"><img src="assets/${entityId}.svg" alt="${ev.type}"></div>`;
          }
        }
      }
    }
  }
}
