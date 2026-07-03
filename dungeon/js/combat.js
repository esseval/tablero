const DICE_SIDES = 6;

export function roll(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollDice(count) {
  let sum = 0;
  for (let i = 0; i < count; i++) sum += roll(1, DICE_SIDES);
  return sum;
}

export function xpThreshold(level) {
  return level * 50;
}

export function checkLevelUp(p) {
  let leveled = false;
  while (p.xp >= xpThreshold(p.level)) {
    p.xp -= xpThreshold(p.level);
    p.level++;
    p.maxHp += 2;
    p.hp = Math.min(p.hp + 2, p.maxHp);
    leveled = true;
  }
  return leveled;
}

// Un asalto: el jugador ataca, y si el enemigo sobrevive, contraataca.
// Muta state.player y enemy (hp se persiste en el event.data del mapa).
export function resolveAttackRound(state, enemy) {
  const p     = state.player;
  const lines = [];

  const atkRoll = rollDice(p.atkDice || 1);
  const pDmg = Math.max(0, (p.atk + atkRoll) - enemy.def);
  enemy.hp -= pDmg;
  lines.push({ cls: 'combat', txt: `⚔ Atacas: ${p.atk}+${atkRoll} → ${pDmg} daño → ${enemy.name} HP: ${Math.max(0, enemy.hp)}` });

  if (enemy.hp <= 0) {
    const xpGained = enemy.xp || 1;
    p.gold += enemy.gold;
    p.xp += xpGained;
    const leveledUp = checkLevelUp(p);
    lines.push({ cls: 'loot', txt: `✓ Derrotaste a ${enemy.name}. +${enemy.gold} oro  +${xpGained} XP` });
    return { died: true, lines, xpGained, leveledUp, newLevel: p.level };
  }

  const defRoll = rollDice(p.defDice || 1);
  const eDmg = Math.max(0, (enemy.atk + roll(0, 3)) - (p.def + defRoll));
  p.hp -= eDmg;
  lines.push({ cls: 'combat', txt: `  ${enemy.name} contraataca: ${eDmg} daño → Tu HP: ${Math.max(0, p.hp)} (DEF:${p.def}+${defRoll})` });

  if (p.hp <= 0) {
    lines.push({ cls: 'dead', txt: `✗ Fuiste derrotado por ${enemy.name}.` });
    return { died: true, playerDied: true, lines };
  }

  return { died: false, lines };
}
