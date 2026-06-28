export function updateHUD(state) {
  const p = state.player;
  console.log(p);
  document.getElementById('stat-hp-val').textContent    = `${Math.max(0, p.hp)}/${p.maxHp}`;
  document.getElementById('stat-atk-val').textContent   = p.atk;
  document.getElementById('stat-def-val').textContent   = p.def;
  document.getElementById('stat-dice-atk').textContent  = p.atkDice;
  document.getElementById('stat-dice-def').textContent  = p.defDice;
  document.getElementById('stat-dice-mov').textContent  = p.moveDice;
  document.getElementById('stat-gold-val').textContent  = p.gold;
  document.getElementById('stat-turns-val').textContent  = state.turns;
  document.getElementById('stat-steps-val').textContent  = state.stepsRemaining;
  const pct = Math.max(0, (p.hp / p.maxHp) * 100);
  document.getElementById('bar-hp').style.width = pct + '%';
}
