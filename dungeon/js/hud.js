export function updateHUD(state) {
  const p = state.player;
  document.getElementById('stat-hp-val').textContent    = `${Math.max(0, p.hp)}/${p.maxHp}`;
  document.getElementById('stat-atk-val').textContent   = p.atk;
  document.getElementById('stat-def-val').textContent   = p.def;
  document.getElementById('stat-gold-val').textContent  = p.gold;
  document.getElementById('stat-turns-val').textContent = state.turns;
  const pct = Math.max(0, (p.hp / p.maxHp) * 100);
  document.getElementById('bar-hp').style.width = pct + '%';
}
