import { createEnemy, ENEMY_TYPES } from '../enemies.js';
import { createRNG } from './rng.js';

const TILESET = {
  floor:    { passable: true,  asset: "floor"    },
  wall:     { passable: false, asset: "wall"     },
  exit:     { passable: true,  asset: "exit"     },
  entrance: { passable: true,  asset: "entrance" },
  door:     { passable: true,  asset: "door"     },
  "door-locked":     { passable: true,  asset: "door-locked" },
};

const SUFFIXES = [
  'Olvido', 'Sombra', 'Fuego', 'Cristal', 'Hielo',
  'Araña', 'Sangre', 'Polvo', 'Eco', 'Runa',
  'Niebla', 'Roca', 'Viento', 'Lava', 'Oscuridad',
];

class BSPNode {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.left = null; this.right = null; this.room = null;
  }
}

function bspSplit(node, depth, maxDepth, minSize, rng) {
  if (depth >= maxDepth) return;

  let horiz = false;
  const canH = node.h >= minSize * 2;
  const canV = node.w >= minSize * 2;
  if (!canH && !canV) return;
  if (canH && !canV) horiz = true;
  else if (!canH && canV) horiz = false;
  else horiz = rng() > 0.5;

  const ratio = 0.35 + rng() * 0.3;

  if (horiz) {
    const sy = Math.floor(node.y + ratio * node.h);
    if (sy - node.y < minSize || node.y + node.h - sy < minSize) return;
    node.left  = new BSPNode(node.x, node.y,       node.w, sy - node.y);
    node.right = new BSPNode(node.x, sy,           node.w, node.y + node.h - sy);
  } else {
    const sx = Math.floor(node.x + ratio * node.w);
    if (sx - node.x < minSize || node.x + node.w - sx < minSize) return;
    node.left  = new BSPNode(node.x, node.y, sx - node.x,         node.h);
    node.right = new BSPNode(sx,     node.y, node.x + node.w - sx, node.h);
  }

  bspSplit(node.left,  depth + 1, maxDepth, minSize, rng);
  bspSplit(node.right, depth + 1, maxDepth, minSize, rng);
}

function carveRooms(node, rsMin, rsMax, rng) {
  if (node.left || node.right) {
    if (node.left)  carveRooms(node.left,  rsMin, rsMax, rng);
    if (node.right) carveRooms(node.right, rsMin, rsMax, rng);
    return;
  }

  const maxW = Math.min(node.w - 2, rsMax);
  const maxH = Math.min(node.h - 2, rsMax);
  const minW = Math.min(rsMin, maxW);
  const minH = Math.min(rsMin, maxH);
  if (maxW < minW || maxH < minH) return;

  const w = minW + Math.floor(rng() * (maxW - minW + 1));
  const h = minH + Math.floor(rng() * (maxH - minH + 1));
  const x = node.x + 1 + Math.floor(rng() * (node.w - 2 - w));
  const y = node.y + 1 + Math.floor(rng() * (node.h - 2 - h));

  node.room = { x, y, w, h };
}

function getLeaves(node) {
  if (!node) return [];
  if (node.room) return [node];
  return [...getLeaves(node.left), ...getLeaves(node.right)];
}

function carveCorridor(map, x1, y1, x2, y2) {
  let x = Math.floor(x1);
  let y = Math.floor(y1);
  const tx = Math.floor(x2);
  const ty = Math.floor(y2);

  while (x !== tx) {
    if (y >= 0 && y < map.length && x >= 0 && x < map[0].length) {
      if (map[y][x] === 'wall') map[y][x] = 'floor';
    }
    x += x < tx ? 1 : -1;
  }
  while (y !== ty) {
    if (y >= 0 && y < map.length && x >= 0 && x < map[0].length) {
      if (map[y][x] === 'wall') map[y][x] = 'floor';
    }
    y += y < ty ? 1 : -1;
  }
}

function connectRooms(node, map, rng) {
  if (!node || !node.left || !node.right) return;

  connectRooms(node.left, map, rng);
  connectRooms(node.right, map, rng);

  const ll = getLeaves(node.left);
  const rl = getLeaves(node.right);
  if (!ll.length || !rl.length) return;

  const a = ll[Math.floor(rng() * ll.length)].room;
  const b = rl[Math.floor(rng() * rl.length)].room;

  carveCorridor(map,
    Math.floor(a.x + a.w / 2), Math.floor(a.y + a.h / 2),
    Math.floor(b.x + b.w / 2), Math.floor(b.y + b.h / 2)
  );
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function pickEnemyId(level, rng) {
  const pool = [];
  if (level <= 0.25)             pool.push('spider');
  if (level >= 0.1 && level <= 0.5) pool.push('goblin', 'skeleton');
  if (level >= 0.35 && level <= 0.7) pool.push('skeleton', 'troll');
  if (level >= 0.55)                pool.push('troll', 'dragon');
  return pool.length ? pool[Math.floor(rng() * pool.length)] : 'spider';
}

function scaleStats(id, difficulty) {
  const base = ENEMY_TYPES[id];
  const hp = Math.round(base.hp * difficulty.hpMult);
  return {
    name: base.name,
    hp,
    atk: Math.round(base.atk * difficulty.atkMult),
    def: Math.round(base.def * difficulty.atkMult),
    gold: base.gold,
    xp: base.xp,
    moveDice: difficulty.enemyMoveDice,
  };
}

function generateFallback(rows, cols, difficulty, seed, rng) {
  const map = Array.from({ length: rows }, () => Array(cols).fill('wall'));

  const rooms = [];
  const rw = Math.min(5, Math.max(3, Math.floor(cols * 0.3)));
  const rh = Math.min(4, Math.max(2, Math.floor(rows * 0.35)));
  const gap = 2;

  let colsAvail = cols;
  let colPos = 1;
  while (colPos + rw + 1 < cols && rooms.length < 4) {
    const rowPos = 1 + Math.floor(rng() * Math.max(1, rows - rh - 2));
    rooms.push({ x: colPos, y: rowPos, w: rw, h: Math.min(rh, rows - rowPos - 1) });
    colPos += rw + gap;
    colsAvail = cols - colPos;
  }

  if (rooms.length < 2) {
    rooms.push({ x: 1, y: Math.max(1, rows - rh - 1), w: rw, h: Math.min(rh, rows - 2) });
  }

  for (const rm of rooms) {
    for (let r = rm.y; r < Math.min(rm.y + rm.h, rows); r++)
      for (let c = rm.x; c < Math.min(rm.x + rm.w, cols); c++)
        if (r >= 0 && c >= 0) map[r][c] = 'floor';
  }

  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1], b = rooms[i];
    carveCorridor(map,
      Math.floor(a.x + a.w / 2), Math.floor(a.y + a.h / 2),
      Math.floor(b.x + b.w / 2), Math.floor(b.y + b.h / 2)
    );
  }

  const entranceC = {
    r: Math.min(Math.floor(rooms[0].y + rooms[0].h / 2), rows - 1),
    c: Math.min(Math.floor(rooms[0].x + rooms[0].w / 2), cols - 1),
  };
  const last = rooms[rooms.length - 1];
  const exitC = {
    r: Math.min(Math.floor(last.y + last.h / 2), rows - 1),
    c: Math.min(Math.floor(last.x + last.w / 2), cols - 1),
  };

  map[entranceC.r][entranceC.c] = 'entrance';
  map[exitC.r][exitC.c] = 'exit';

  return { entranceC, exitC, map, rows, cols, difficulty, rng };
}

function scaleForProgression(baseDiff, index, total) {
  if (total <= 1) return { ...baseDiff };
  const t = index / (total - 1);
  const lo = (a, b) => Math.round(a + t * (b - a));

  return {
    ...baseDiff,
    rows:  { min: Math.max(10, lo(baseDiff.rows.min - 3, baseDiff.rows.min)), max: Math.max(12, lo(baseDiff.rows.max - 3, baseDiff.rows.max)) },
    cols:  { min: Math.max(14, lo(baseDiff.cols.min - 4, baseDiff.cols.min)), max: Math.max(16, lo(baseDiff.cols.max - 4, baseDiff.cols.max)) },
    enemyDensity:   +(baseDiff.enemyDensity * (0.5 + t * 0.5)).toFixed(3),
    enemyLevel:     { min: 0, max: +(baseDiff.enemyLevel.max * (0.4 + t * 0.6)).toFixed(2) },
    hpMult:         +(0.6 + t * (baseDiff.hpMult - 0.6)).toFixed(2),
    atkMult:        +(0.5 + t * (baseDiff.atkMult - 0.5)).toFixed(2),
    trapDensity:    +(baseDiff.trapDensity * (0.4 + t * 0.6)).toFixed(3),
    potionDensity:  +(baseDiff.potionDensity * (1.6 - t * 0.6)).toFixed(3),
    enemyMoveDice:  t > 0.7 ? baseDiff.enemyMoveDice : Math.max(1, baseDiff.enemyMoveDice - 1),
  };
}

export function generateLevels(baseDiff) {
  const count = baseDiff.levelCount;
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  const levels = [];

  for (let i = 0; i < count; i++) {
    const diff = scaleForProgression(baseDiff, i, count);
    const seed = (Date.now() * 0x1F1F1F1F + i * 0xDEADBEEF) >>> 0;
    const level = generateLevel(diff, seed);
    level.meta.name = `Mazmorra del ${suffix} — Nivel ${i + 1}`;
    levels.push(level);
  }

  return levels;
}

export function generateLevel(difficulty, seed) {
  const rng = createRNG(seed ?? Date.now());

  const rows = difficulty.rows.min + Math.floor(rng() * (difficulty.rows.max - difficulty.rows.min + 1));
  const cols = difficulty.cols.min + Math.floor(rng() * (difficulty.cols.max - difficulty.cols.min + 1));

  const bspMin = Math.min(6, Math.floor(Math.min(rows, cols) / 3));
  const root = new BSPNode(1, 1, cols - 2, rows - 2);
  bspSplit(root, 0, 4, bspMin, rng);
  carveRooms(root, difficulty.roomSize.min, difficulty.roomSize.max, rng);

  const map = Array.from({ length: rows }, () => Array(cols).fill('wall'));

  const leaves = getLeaves(root);

  let entranceC, exitC;

  if (leaves.length < 2) {
    const fb = generateFallback(rows, cols, difficulty, seed, rng);
    map.splice(0, map.length, ...fb.map);
    entranceC = fb.entranceC;
    exitC = fb.exitC;
  } else {
    for (const leaf of leaves) {
      const { x, y, w, h } = leaf.room;
      for (let r = y; r < y + h && r < rows; r++)
        for (let c = x; c < x + w && c < cols; c++)
          if (r >= 0 && c >= 0) map[r][c] = 'floor';
    }

    connectRooms(root, map, rng);

    entranceC = {
      r: Math.floor(leaves[0].room.y + leaves[0].room.h / 2),
      c: Math.floor(leaves[0].room.x + leaves[0].room.w / 2),
    };

    let maxDist = -1;
    let exitLeaf = leaves[0];
    for (const leaf of leaves) {
      const cr = Math.floor(leaf.room.y + leaf.room.h / 2);
      const cc = Math.floor(leaf.room.x + leaf.room.w / 2);
      const d = Math.abs(cr - entranceC.r) + Math.abs(cc - entranceC.c);
      if (d > maxDist) { maxDist = d; exitLeaf = leaf; }
    }
    exitC = {
      r: Math.floor(exitLeaf.room.y + exitLeaf.room.h / 2),
      c: Math.floor(exitLeaf.room.x + exitLeaf.room.w / 2),
    };

    map[entranceC.r][entranceC.c] = 'entrance';
    map[exitC.r][exitC.c] = 'exit';
  }

  const floorCells = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (map[r][c] === 'floor' && !(r === entranceC.r && c === entranceC.c) && !(r === exitC.r && c === exitC.c))
        floorCells.push([r, c]);

  shuffle(floorCells, rng);

  const events = {};
  const total = rows * cols;
  let idx = 0;

  function place(density, makeEvent) {
    const count = Math.floor(total * density);
    for (let i = 0; i < count && idx < floorCells.length; i++) {
      const [r, c] = floorCells[idx++];
      if (map[r][c] === 'floor') {
        events[`${r},${c}`] = makeEvent(r, c);
      }
    }
  }

  place(difficulty.enemyDensity, () => {
    const el = difficulty.enemyLevel.min + rng() * (difficulty.enemyLevel.max - difficulty.enemyLevel.min);
    const id = pickEnemyId(el, rng);
    return { type: 'enemy', data: createEnemy(id, scaleStats(id, difficulty)) };
  });

  place(difficulty.treasureDensity, () => {
    const gold = 5 + Math.floor(rng() * 16);
    return { type: 'treasure', data: { gold, msg: `¡Tesoro! +${gold} oro` } };
  });

  place(difficulty.trapDensity, () => {
    const dmg = 2 + Math.floor(rng() * 4);
    return { type: 'trap', data: { dmg, msg: `¡Trampa! -${dmg} HP` } };
  });

  place(difficulty.potionDensity, () => {
    const hp = 4 + Math.floor(rng() * 8);
    return { type: 'potion', data: { hp, msg: `Poción. +${hp} HP` } };
  });

  place(difficulty.keyDensity, () => ({
    type: 'key', data: { keys: 1 },
  }));

  const suffix = SUFFIXES[Math.floor(rng() * SUFFIXES.length)];
  const name = `Mazmorra del ${suffix}`;

  return {
    meta: { name, rows, cols, startPos: [entranceC.r, entranceC.c] },
    tileset: { ...TILESET },
    map,
    events,
  };
}
