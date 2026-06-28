const DICE_SIDES = 6;

export function roll(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollDice(count) {
  let sum = 0;
  for (let i = 0; i < count; i++) sum += roll(1, DICE_SIDES);
  return sum;
}

export function resolveCombat(state, enemy) {
  const p     = state.player;
  const lines = [];
  lines.push({ cls: 'sys', txt: `⚔ Encuentro: ${enemy.name} (HP:${enemy.hp} ATK:${enemy.atk} DEF:${enemy.def})` });

  while (enemy.hp > 0 && p.hp > 0) {
    const atkRoll = rollDice(p.atkDice || 1);
    const pDmg = Math.max(0, (p.atk + atkRoll) - enemy.def);
    enemy.hp -= pDmg;
    lines.push({ cls: 'combat', txt: `  Tu ataque: ${p.atk}+${atkRoll} → ${pDmg} daño → ${enemy.name} HP: ${Math.max(0, enemy.hp)}` });
    if (enemy.hp <= 0) break;

    const defRoll = rollDice(p.defDice || 1);
    const eDmg = Math.max(0, (enemy.atk + roll(0, 3)) - (p.def + defRoll));
    p.hp -= eDmg;
    lines.push({ cls: 'combat', txt: `  ${enemy.name} ataca: ${eDmg} daño → Tu HP: ${Math.max(0, p.hp)} (DEF:${p.def}+${defRoll})` });
  }

  if (p.hp > 0) {
    p.gold += enemy.gold;
    lines.push({ cls: 'loot', txt: `✓ Derrotaste a ${enemy.name}. +${enemy.gold} oro` });
    return { won: true, lines };
  }
  lines.push({ cls: 'dead', txt: `✗ Fuiste derrotado por ${enemy.name}.` });
  return { won: false, lines };
}
