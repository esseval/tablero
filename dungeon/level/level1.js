import { PLAYER_BASE } from '../player.js';
import { createEnemy } from '../enemies.js';

export default {
  meta: {
    name: "La Mazmorra del Olvido",
    rows: 12,
    cols: 12,
    startPos: [1, 1],
    player: { ...PLAYER_BASE }
  },
  tileset: {
    floor:    { passable: true,  asset: "floor"    },
    wall:     { passable: false, asset: "wall"     },
    exit:     { passable: true,  asset: "exit"     },
    entrance: { passable: true,  asset: "entrance" }
  },
  map: [
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"],
    ["wall","entrance","floor","floor","wall","floor","floor","floor","floor","floor","floor","wall"],
    ["wall","floor","wall","floor","wall","floor","wall","wall","floor","wall","floor","wall"],
    ["wall","floor","wall","floor","floor","floor","floor","wall","floor","floor","floor","wall"],
    ["wall","floor","wall","wall","wall","floor","wall","wall","floor","wall","floor","wall"],
    ["wall","floor","floor","floor","floor","floor","floor","floor","floor","wall","floor","wall"],
    ["wall","wall","wall","floor","wall","wall","floor","wall","floor","wall","floor","wall"],
    ["wall","floor","floor","floor","wall","floor","floor","floor","floor","floor","floor","wall"],
    ["wall","floor","wall","wall","wall","floor","wall","wall","wall","floor","wall","wall"],
    ["wall","floor","floor","floor","floor","floor","floor","wall","floor","floor","floor","wall"],
    ["wall","wall","floor","wall","wall","floor","floor","floor","floor","wall","exit","wall"],
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"]
  ],
  events: {
    "2,1": { type:"enemy", data: createEnemy('spider',   { name:"Araña" })},
    "3,5": { type:"enemy", data: createEnemy('spider',   { name:"Araña Gigante",     hp:8,  atk:4, def:1, gold:4,  xp:7  })},
    "5,3": { type:"enemy", data: createEnemy('skeleton', { name:"Esqueleto" })},
    "7,5": { type:"enemy", data: createEnemy('skeleton', { name:"Esqueleto" })},
    "5,8": { type:"enemy", data: createEnemy('troll',    { name:"Troll" })},
    "9,5": { type:"enemy", data: createEnemy('skeleton', { name:"Esqueleto" })},
    "9,8": { type:"enemy", data: createEnemy('troll',    { name:"Guardián" })},
    "4,5": { type:"enemy", data: createEnemy('goblin',   { name:"Goblin"  })},
    "6,6": { type:"enemy", data: createEnemy('goblin',   { name:"Goblin Merodeador", hp:9,  atk:4, def:2, gold:6,  xp:8  })},
    "1,6": { type:"treasure", data:{ gold:12, msg:"Un cofre polvoriento. ¡12 monedas de oro!" }},
    "3,9": { type:"treasure", data:{ gold:8,  msg:"Monedas dispersas por el suelo. +8 oro" }},
    "7,9": { type:"treasure", data:{ gold:20, msg:"Un cofre sellado. ¡20 monedas de oro!", xp:5 }},
    "1,9": { type:"potion",   data:{ hp:8,   msg:"Una poción de vida. Recuperás 8 HP." }},
    "6,5": { type:"potion",   data:{ hp:6,   msg:"Una poción débil. Recuperás 6 HP." }},
    "9,2": { type:"potion",   data:{ hp:10,  msg:"Una poción fuerte. Recuperás 10 HP." }},
    "1,3": { type:"npc",     data:{ name:"Mercader Errante", msg:"¡Bienvenido, aventurero! ¿Qué necesitás?", items:[
      { type:"potion", hp:10,  price:8, stock: 5 },
      { type:"weapon", name:"Daga oxidada",  atk:1, price:12, stock: 2 },
      { type:"armor",  name:"Escudo de madera", def:1, price:15, stock: 1 }, 
      { type:"armor",  name:"Cota de malla", def:2, price:20, stock: 1 }
    ]}},
    "2,9": { type:"trap",     data:{ dmg:4,  msg:"¡Una trampa de pinchos! Recibís 4 de daño." }},
    "4,8": { type:"trap",     data:{ dmg:6,  msg:"¡El suelo cede! Caés y recibís 6 de daño." }},
    "7,2": { type:"trap",     data:{ dmg:5,  msg:"¡Una trampa oculta! Recibís 5 de daño." }}
  }
};