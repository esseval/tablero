export function roll(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function resolveCombat(state, enemy) {
  const p     = state.player;
  const lines = [];
  lines.push({ cls: 'sys', txt: `⚔ Encuentro: ${enemy.name} (HP:${enemy.hp} ATK:${enemy.atk} DEF:${enemy.def})` });

  while (enemy.hp > 0 && p.hp > 0) {
    const pDmg = Math.max(0, (p.atk + roll(1, 5)) - enemy.def);
    enemy.hp -= pDmg;
    lines.push({ cls: 'combat', txt: `  Tu ataque: ${pDmg} daño → ${enemy.name} HP: ${Math.max(0, enemy.hp)}` });
    if (enemy.hp <= 0) break;

    const eDmg = Math.max(0, (enemy.atk + roll(0, 3)) - p.def);
    p.hp -= eDmg;
    lines.push({ cls: 'combat', txt: `  ${enemy.name} ataca: ${eDmg} daño → Tu HP: ${Math.max(0, p.hp)}` });
  }

  if (p.hp > 0) {
    p.gold += enemy.gold;
    lines.push({ cls: 'loot', txt: `✓ Derrotaste a ${enemy.name}. +${enemy.gold} oro` });
    return { won: true, lines };
  }
  lines.push({ cls: 'dead', txt: `✗ Fuiste derrotado por ${enemy.name}.` });
  return { won: false, lines };
}
