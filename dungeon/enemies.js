/**
 * ENEMY_TYPES — catálogo de especies de enemigo, con sus stats base.
 *
 * El `id` de cada especie debe coincidir con el nombre de un asset en
 * `assets/` (ver renderer.js, que usa `id` para resolver el sprite).
 * `name`, `hp`, `maxHp`, `atk`, `def`, `gold` y `xp` son los valores por
 * defecto de la especie; cada instancia de nivel puede pisar cualquiera
 * de ellos (ej. un "Esqueleto Jefe" más fuerte que el esqueleto base).
 */
export const ENEMY_TYPES = {
  spider:   { name: "Araña",     hp: 6,  maxHp: 6,  atk: 3,  def: 1, gold: 3,  xp: 5  },
  skeleton: { name: "Esqueleto", hp: 12, maxHp: 12, atk: 5,  def: 3, gold: 8,  xp: 12 },
  goblin:   { name: "Goblin",    hp: 7,  maxHp: 7,  atk: 4,  def: 2, gold: 5,  xp: 6  },
  troll:    { name: "Troll",     hp: 18, maxHp: 18, atk: 7,  def: 5, gold: 15, xp: 20 },
  dragon:   { name: "Dragón",    hp: 40, maxHp: 40, atk: 11, def: 6, gold: 50, xp: 60 },
};

/**
 * createEnemy — estandariza la forma de un enemigo de nivel, partiendo de
 * los stats base de su especie (`ENEMY_TYPES[id]`) y pisándolos con los
 * valores propios de la instancia.
 *
 * `maxHp` siempre se deriva de `hp` (propio o heredado): un enemigo nace
 * a vida completa, así que no hace falta declararlo aparte.
 *
 * @param {keyof ENEMY_TYPES} id — especie, debe existir en ENEMY_TYPES.
 * @param {{hp?:number, atk?:number, def?:number, gold?:number, xp?:number, name?:string}} [overrides]
 * @returns {{id:string, name:string, hp:number, maxHp:number, atk:number, def:number, gold:number, xp:number}}
 */
export function createEnemy(id, overrides = {}) {
  const base = ENEMY_TYPES[id];
  const hp = overrides.hp ?? base.hp;
  return {
    id,
    name: overrides.name || base.name,
    hp,
    maxHp: hp,
    atk: overrides.atk ?? base.atk,
    def: overrides.def ?? base.def,
    gold: overrides.gold ?? base.gold,
    xp: overrides.xp ?? base.xp,
  };
}
