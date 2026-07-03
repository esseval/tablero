export const CLASSES = {
  warrior: {
    name: "Guerrero",
    desc: "Alta vida y defensa. Empieza con armadura.",
    sprite: "player-warrior",
    stats: { hp: 25, maxHp: 25, atk: 7, def: 4, moveDice: 1, atkDice: 1, defDice: 1, visionRange: 3, gold: 0, xp: 0, level: 1 },
  },
  rogue: {
    name: "Ladrón",
    desc: "Más pasos por turno y mayor visión. Esquiva mejor.",
    sprite: "player-rogue",
    stats: { hp: 16, maxHp: 16, atk: 4, def: 2, moveDice: 2, atkDice: 1, defDice: 1, visionRange: 4, gold: 10, xp: 0, level: 1 },
  },
  mage: {
    name: "Mago",
    desc: "Doble dado de ataque. Frágil pero letal.",
    sprite: "player-mage",
    stats: { hp: 14, maxHp: 14, atk: 3, def: 1, moveDice: 1, atkDice: 2, defDice: 1, visionRange: 3, gold: 3, xp: 0, level: 1 },
  },
};
