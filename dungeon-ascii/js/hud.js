import { xpThreshold } from '../../dungeon/js/combat.js';

function bar(pct, len) {
  const full = Math.round((pct / 100) * len);
  return '\u2588'.repeat(full) + '\u2591'.repeat(len - full);
}

export function updateHUD(state) {
  const p = state.player;
  const hpPct = Math.max(0, (p.hp / p.maxHp) * 100);
  const xpMax = xpThreshold(p.level);
  const xpPct = Math.min(100, (p.xp / xpMax) * 100);
  const name = state.board.meta.name || '';
  const labelWidth = 20;
  function L(s) { return s.padEnd(labelWidth); }

  const lines = [
    '\u250c' + '\u2500'.repeat(labelWidth + 2) + '\u2510',
    '\u2502  ' + L(name.slice(0, labelWidth)) + '\u2502',
    '\u2502  ' + L('HP ' + bar(hpPct, 8) + ' ' + Math.max(0, p.hp) + '/' + p.maxHp) + '\u2502',
    '\u2502  ' + L('XP ' + bar(xpPct, 8) + ' ' + p.xp + '/' + xpMax) + '\u2502',
    '\u2502  ' + L('Nv.' + p.level + '  ATK ' + p.atk + '  DEF ' + p.def) + '\u2502',
    '\u2502  ' + L('DEX ' + p.dex + '  ORO ' + p.gold) + '\u2502',
    '\u2502  ' + L('LLAVES ' + p.keys) + '\u2502',
    '\u251c' + '\u2500'.repeat(labelWidth + 2) + '\u2524',
    '\u2502  ' + L('Dados: A' + p.atkDice + ' D' + p.defDice + ' X' + p.dexDice + ' M' + p.moveDice) + '\u2502',
    '\u251c' + '\u2500'.repeat(labelWidth + 2) + '\u2524',
    '\u2502  ' + L('Turno ' + state.turns + '  Pasos ' + state.stepsRemaining) + '\u2502',
    '\u2502  ' + L('Fase: ' + (state.phase === 'player' ? 'JUGADOR' : 'MAZMORRA')) + '\u2502',
    '\u2514' + '\u2500'.repeat(labelWidth + 2) + '\u2518',
  ];

  document.getElementById('ascii-hud').textContent = lines.join('\n');

  document.getElementById('stat-turns-val').textContent = state.turns;
  document.getElementById('stat-steps-val').textContent = state.stepsRemaining;
  const phaseEl = document.getElementById('stat-phase-val');
  phaseEl.textContent = state.phase === 'player' ? 'Jugador' : 'Mazmorra';
  phaseEl.style.color = state.phase === 'player' ? '#44ff88' : '#ff5555';
}
