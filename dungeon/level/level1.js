import { createEnemy } from '../enemies.js';

export default {
  meta: {
    name: "La Mazmorra del Olvido",
    rows: 12,
    cols: 20,
    startPos: [1, 1],
  },
  tileset: {
    floor:    { passable: true,  asset: "floor"    },
    wall:     { passable: false, asset: "wall"     },
    exit:     { passable: true,  asset: "exit"     },
    entrance: { passable: true,  asset: "entrance" },
    door:        { passable: false, asset: "door"     },
    'door-locked': { passable: false, asset: "door-locked" }
  },
  map: [
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"],
    ["wall","entrance","floor","door-locked","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","wall"],
    ["wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall"],
    ["wall","floor","floor","door-locked","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","door-locked","wall","floor","wall"],
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","floor","wall"],
    ["wall","floor","floor","floor","floor","door","floor","floor","floor","floor","floor","floor","floor","floor","floor","wall","floor","wall","floor","wall"],
    ["wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","floor","wall","floor","wall"],
    ["wall","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","wall","floor","floor","floor","wall"],
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","wall","wall","floor","wall"],
    ["wall","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","wall","floor","wall"],
    ["wall","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","wall","exit","wall"],
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"]
  ],
  events: {
    "1,5":  { type:"enemy", data: createEnemy('spider',   { name:"Araña de las Ruinas" })},
    "3,6":  { type:"enemy", data: createEnemy('goblin',   { name:"Goblin Corredor",     hp:10, atk:5, def:2, gold:6,  xp:9  })},
    "5,8":  { type:"enemy", data: createEnemy('skeleton', { name:"Esqueleto Guardián",  hp:14, atk:6, def:3, gold:7,  xp:11 })},
    "7,6":  { type:"enemy", data: createEnemy('goblin',   { name:"Goblin Merodeador",   hp:11, atk:5, def:2, gold:7,  xp:10 })},
    "9,12": { type:"enemy", data: createEnemy('troll',    { name:"Troll del Pantano",   hp:20, atk:8, def:4, gold:10, xp:16 })},
    "10,8": { type:"enemy", data: createEnemy('spider',   { name:"Araña Tejedora",      hp:9,  atk:4, def:1, gold:5,  xp:8  })},
    "1,10": { type:"treasure", data:{ gold:10, msg:"Un cofre polvoriento. ¡10 monedas de oro!" }},
    "9,6":  { type:"treasure", data:{ gold:15, msg:"Monedas de un aventurero caído. +15 oro", xp:5, keys:1 }},
    "3,2":  { type:"key",      data:{ keys:1 }},
    "3,12": { type:"potion",   data:{ hp:8,   msg:"Una poción rojiza. Recuperás 8 HP." }},
    "7,10": { type:"potion",   data:{ hp:10,  msg:"Una poción brillante. Recuperás 10 HP." }},
    "5,2":  { type:"trap",     data:{ dmg:4,  msg:"¡Una trampa de pinchos! Recibís 4 de daño." }},
    "10,4": { type:"trap",     data:{ dmg:5,  msg:"¡El suelo cede bajo tus pies! Recibís 5 de daño." }},
    "7,13": { type:"npc",     data:{ name:"Mercader Callejero", msg:"¡Eh, tú! Mirá nomás lo que tengo.", items:[
      { type:"potion", hp:10,  price:8,  stock: 5 },
      { type:"weapon", name:"Daga oxidada",  atk:1, price:12, stock: 2 },
      { type:"armor",  name:"Escudo de madera", def:1, price:15, stock: 1 },
      { type:"armor",  name:"Cota de malla", def:2, price:20, stock: 1 }
    ]}}
  }
};
