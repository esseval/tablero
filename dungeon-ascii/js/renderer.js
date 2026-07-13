const TILE_CHARS = {
  floor:        '.',
  wall:         '#',
  exit:         '>',
  entrance:     '<',
  door:         '+',
  'door-locked': '*',
};

const TILE_COLORS = {
  floor:        '#666',
  wall:         '#8b7355',
  exit:         '#44cc44',
  entrance:     '#4488ff',
  door:         '#ccaa44',
  'door-locked': '#cc4444',
};

const ENTITY_CHARS = {
  treasure: '$',
  potion:   '!',
  trap:     '^',
  npc:      'M',
  key:      'k',
};

const ENTITY_COLORS = {
  enemy:    '#ff5555',
  treasure: '#ffcc00',
  potion:   '#44ff44',
  trap:     '#ff8800',
  npc:      '#8888ff',
  key:      '#ffaa44',
};

const ENEMY_SPECIES_CHARS = {
  spider:   'S',
  skeleton: 'K',
  goblin:   'G',
  troll:    'T',
  dragon:   'D',
};

function getEntityChar(ev) {
  if (ev.type === 'enemy') return ENEMY_SPECIES_CHARS[ev.data.id] || 'E';
  return ENTITY_CHARS[ev.type] || '?';
}

function getEntityColor(ev) {
  if (ev.type === 'enemy') return ENTITY_COLORS.enemy;
  return ENTITY_COLORS[ev.type] || '#fff';
}

export function cellEl(r, c) {
  return document.querySelector(`#board .cell[data-r="${r}"][data-c="${c}"]`);
}

export function flashCell(r, c, cls) {
  requestAnimationFrame(() => {
    const el = cellEl(r, c);
    if (!el) return;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 350);
  });
}

export function getEventAssetId(ev) {
  if (ev.type === 'enemy')    return ev.data.id;
  if (ev.type === 'treasure') return 'treasure';
  if (ev.type === 'potion')   return 'potion';
  if (ev.type === 'trap')     return 'trap';
  if (ev.type === 'npc')      return 'npc';
  if (ev.type === 'key')      return 'key';
  return null;
}

export function buildBoard(boardData, container, onCellClick, getState) {
  const rows = boardData.map.length;
  const cols = boardData.map[0].length;
  container.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
  container.style.gridTemplateRows    = `repeat(${rows}, 30px)`;
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
        if (!st.visible?.has(key)) return;
        const ev = st.events?.[key];
        if (!ev) return;
        if (ev.type === 'enemy') {
          cell.title = `${ev.data.name} | HP:${ev.data.hp} ATK:${ev.data.atk} DEF:${ev.data.def}`;
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
  const defaultColor = TILE_COLORS.floor;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const el  = cellEl(r, c);
      if (!el) continue;

      el.className = 'cell';
      const tileId = state.board.map[r][c];
      const tile   = state.board.tileset[tileId];

      if (!state.visible.has(key)) {
        if (state.revealed?.has(key)) {
          el.className += ' visited';
          el.textContent = '.';
          el.style.color = '#222';
          el.title = '';
        } else {
          el.className += ' fog';
          el.textContent = '';
          el.style.color = 'transparent';
          el.title = '';
        }
        continue;
      }

      const dist = state.dim.get(key);
      if (dist !== undefined) {
        el.className += ' dim';
      }

      if (tile && !tile.passable) {
        el.className += ' wall';
      }

      const tileCh = TILE_CHARS[tileId] || '.';
      const tileCo = TILE_COLORS[tileId] || defaultColor;

      if (r === pr && c === pc) {
        el.textContent = '@';
        el.style.color = '#44ffcc';
        el.title = '';
      } else {
        const ev = state.events[key];
        if (ev && ((ev.type !== 'potion' && ev.type !== 'trap') || state.searched.has(key))) {
          el.textContent = getEntityChar(ev);
          el.style.color = getEntityColor(ev);
        } else {
          el.textContent = tileCh;
          el.style.color = tileCo;
        }
      }
    }
  }
}
