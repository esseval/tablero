import { restartGame, tryMove, exportBoard, importBoard, rollDice } from './game.js';
import { MANIFEST } from '../level/manifest.js';

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

document.getElementById('btn-end-turn').addEventListener('click', () => rollDice());
document.getElementById('btn-restart').addEventListener('click', () => restartGame(levels));

restartGame(levels);
