import { createEnemy } from '../enemies.js';

export default {
  meta: {
    name: "El Pasillo de las Sombras",
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
    ["wall","entrance","floor","floor","floor","floor","floor","floor","floor","floor","door","floor","floor","floor","floor","floor","floor","floor","floor","wall"],
    ["wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall"],
    ["wall","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","door-locked","wall","floor","wall"],
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","floor","wall"],
    ["wall","floor","floor","floor","floor","door","floor","floor","floor","floor","floor","floor","floor","floor","floor","wall","floor","wall","floor","wall"],
    ["wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","floor","wall","floor","wall"],
    ["wall","floor","floor","floor","floor","floor","floor","floor","floor","door","floor","floor","floor","wall","floor","wall","floor","floor","floor","wall"],
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","floor","wall","floor","wall","floor","wall"],
    ["wall","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","wall","floor","floor","floor","wall","floor","wall","floor","wall"],
    ["wall","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","wall","wall","wall","wall","wall","floor","wall","exit","wall"],
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"]
  ],
  events: {
    "2,1":  { type:"enemy", data: createEnemy('spider',   { name:"Araña Venenosa",      hp:10, atk:4, def:1, gold:4,  xp:8  })},
    "3,6":  { type:"enemy", data: createEnemy('goblin',   { name:"Goblin Cazador",      hp:12, atk:5, def:2, gold:8,  xp:11 })},
    "5,8":  { type:"enemy", data: createEnemy('skeleton', { name:"Esqueleto Maldito",   hp:16, atk:7, def:3, gold:10, xp:15 })},
    "7,3":  { type:"enemy", data: createEnemy('goblin',   { name:"Goblin Chamán",       hp:14, atk:6, def:2, gold:10, xp:14 })},
    "7,11": { type:"enemy", data: createEnemy('skeleton', { name:"Caballero Oscuro",    hp:20, atk:8, def:4, gold:14, xp:20 })},
    "9,4":  { type:"enemy", data: createEnemy('troll',    { name:"Troll de las Sombras",hp:22, atk:8, def:4, gold:12, xp:18 })},
    "9,14": { type:"enemy", data: createEnemy('troll',    { name:"Troll Guardián",      hp:24, atk:9, def:5, gold:16, xp:22 })},
    "10,3": { type:"enemy", data: createEnemy('skeleton', { name:"Espectro",            hp:18, atk:8, def:3, gold:12, xp:18 })},
    "10,8": { type:"enemy", data: createEnemy('goblin',   { name:"Goblin Jefe",         hp:18, atk:7, def:3, gold:14, xp:18 })},
    "2,3":  { type:"key",      data:{ keys:1 }},
    "1,6":  { type:"treasure", data:{ gold:18, msg:"Un cofre cubierto de telarañas. ¡18 monedas de oro!" }},
    "7,17": { type:"treasure", data:{ gold:25, msg:"Tesoro de un paladín caído. +25 oro", xp:8 }},
    "3,12": { type:"potion",   data:{ hp:10,  msg:"Una poción de vida. Recuperás 10 HP." }},
    "9,8":  { type:"potion",   data:{ hp:12,  msg:"Una poción herbal. Recuperás 12 HP." }},
    "5,3":  { type:"trap",     data:{ dmg:5,  msg:"¡Una trampa de flechas! Recibís 5 de daño." }},
    "6,14": { type:"trap",     data:{ dmg:7,  msg:"¡Una trampa de ácido! Recibís 7 de daño." }},
    "8,14": { type:"trap",     data:{ dmg:6,  msg:"¡El suelo se abre! Recibís 6 de daño." }},
    "5,12": { type:"npc",     data:{ name:"Alquimista Errante", msg:"Las sombras son traicioneras. Tengo justo lo que buscás.", items:[
      { type:"potion", hp:12,  price:12, stock: 5 },
      { type:"weapon", name:"Espada corta", atk:2, price:22, stock: 1 },
      { type:"weapon", name:"Hacha de guerra", atk:3, price:35, stock: 1 },
      { type:"armor",  name:"Casco de cuero", def:1, price:15, stock: 1 }
    ]}}
  }
};
