import { restartGame, tryMove, trySearch, exportBoard, importBoard, rollDice, endTurn, toggleEditor, setEditorTile, setEditorEvent } from './game.js';
import { MANIFEST } from '../../dungeon/level/manifest.js';
import { CLASSES } from '../../dungeon/classes.js';
import { generateLevels } from '../../dungeon/js/generator.js';
import { DIFFICULTIES } from '../../dungeon/level/difficulty.js';

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

document.addEventListener('keydown', e => {
  if (e.key === 'b' || e.key === 'B') {
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      trySearch();
    }
  }
});

const staticLevels = await Promise.all(
  MANIFEST.map(name => import(`../../dungeon/level/${name}.js`).then(m => m.default))
);

let chosenDifficulty = null;

// ── difficulty selector ──────────────────────────────────────────────────────

function showDifficultySelector() {
  const overlay = document.getElementById('difficulty-overlay');
  const cards   = document.getElementById('difficulty-cards');
  cards.innerHTML = '';

  for (const [id, diff] of Object.entries(DIFFICULTIES)) {
    const card = document.createElement('div');
    card.className = 'difficulty-card';
    card.innerHTML = `
      <h3>${diff.label}</h3>
      <div class="difficulty-desc">${descFor(id)}</div>
    `;
    card.addEventListener('click', () => {
      overlay.classList.remove('on');
      chosenDifficulty = id;
      showClassSelector();
    });
    cards.appendChild(card);
  }

  const classicCard = document.createElement('div');
  classicCard.className = 'difficulty-card classic';
  classicCard.innerHTML = `<h3>Clasico</h3><div class="difficulty-desc">Los 3 niveles originales de la mazmorra</div>`;
  classicCard.addEventListener('click', () => {
    overlay.classList.remove('on');
    chosenDifficulty = 'classic';
    showClassSelector();
  });
  cards.appendChild(classicCard);

  overlay.classList.add('on');
}

function descFor(id) {
  switch (id) {
    case 'easy':   return `3 pisos — Mazmorra pequena, enemigos debiles`;
    case 'normal': return `5 pisos — Mazmorra media, enemigos balanceados`;
    case 'hard':   return `7 pisos — Mazmorra grande, enemigos agresivos`;
    default:       return '';
  }
}

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
      <div class="class-stat">HP ${s.hp}  ATK ${s.atk}  DEF ${s.def}  DEX ${s.dex}</div>
      <div class="class-stat">mov ${s.moveDice}d6  atk ${s.atkDice}d6  dex ${s.dexDice}d6</div>
      <div class="class-stat">Gold ${s.gold}  Vision ${s.visionRange}</div>
    `;
    card.addEventListener('click', () => {
      overlay.classList.remove('on');
      startGame(id);
    });
    cards.appendChild(card);
  }

  overlay.classList.add('on');
}

function startGame(classId) {
  if (chosenDifficulty === 'classic') {
    restartGame(staticLevels, classId);
  } else {
    const diff = DIFFICULTIES[chosenDifficulty];
    const levels = generateLevels(diff);
    restartGame(levels, classId);
  }
}

document.getElementById('btn-search').addEventListener('click', trySearch);
document.getElementById('btn-end-turn').addEventListener('click', endTurn);
document.getElementById('btn-roll-dice').addEventListener('click', rollDice);
document.getElementById('btn-restart').addEventListener('click', showDifficultySelector);
document.addEventListener('restart-request', showDifficultySelector);

showDifficultySelector();
