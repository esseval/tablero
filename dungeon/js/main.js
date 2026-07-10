import { restartGame, tryMove, trySearch, exportBoard, importBoard, rollDice, endTurn, toggleEditor, setEditorTile, setEditorEvent } from './game.js';
import { MANIFEST } from '../level/manifest.js';
import { CLASSES } from '../classes.js';

const boardEl = document.getElementById('board');

boardEl.addEventListener('keydown', e => {
  const dirs = {
    ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
    w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1],
    W: [-1, 0], S: [1, 0], A: [0, -1], D: [0, 1],
  };
  const dir = dirs[e.key];
  if (dir) { e.preventDefault(); tryMove(dir[0], dir[1]); }
});

document.getElementById('btn-export').addEventListener('click', exportBoard);
document.getElementById('btn-import-trigger').addEventListener('click', () =>
  document.getElementById('file-import').click()
);
document.getElementById('file-import').addEventListener('change', importBoard);

const levels = await Promise.all(
  MANIFEST.map(name => import(`../level/${name}.js`).then(m => m.default))
);

// ── class selector ──────────────────────────────────────────────────────────

function showClassSelector() {
  const overlay = document.getElementById('class-overlay');
  const cards   = document.getElementById('class-cards');
  cards.innerHTML = '';

  for (const [id, cls] of Object.entries(CLASSES)) {
    const s = cls.stats;
    const card = document.createElement('div');
    card.className = 'class-card';
    card.innerHTML = `
      <h3>${cls.name}</h3>
      <div class="class-desc">${cls.desc}</div>
      <div class="class-stat">❤ ${s.hp}  ⚔ ${s.atk}  🛡 ${s.def}  🤸 ${s.dex}</div>
      <div class="class-stat">🎲 <span>mov</span> ${s.moveDice}d6  <span>atk</span> ${s.atkDice}d6  <span>dex</span> ${s.dexDice}d6</div>
      <div class="class-stat">🪙 ${s.gold}  👁 ${s.visionRange}</div>
    `;
    card.addEventListener('click', () => {
      overlay.classList.remove('on');
      restartGame(levels, id);
    });
    cards.appendChild(card);
  }

  overlay.classList.add('on');
}

document.getElementById('btn-search').addEventListener('click', trySearch);
document.getElementById('btn-end-turn').addEventListener('click', endTurn);
document.getElementById('btn-roll-dice').addEventListener('click', rollDice);
document.getElementById('btn-restart').addEventListener('click', showClassSelector);
document.addEventListener('restart-request', showClassSelector);

// ── editor wiring ────────────────────────────────────────────────────────────

document.getElementById('btn-editor').addEventListener('click', toggleEditor);

for (const btn of document.querySelectorAll('#editor-bar .palette-btn')) {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#editor-bar .palette-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tile = btn.dataset.tile;
    const ev   = btn.dataset.event;
    if (tile) setEditorTile(tile);
    if (ev)   setEditorEvent(ev);
  });
}

document.getElementById('btn-export-edited').addEventListener('click', exportBoard);

showClassSelector();
