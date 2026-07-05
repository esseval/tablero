import { createEnemy } from '../enemies.js';

export default {
  meta: {
    name: "La Cámara del Rey Demonio",
    rows: 12,
    cols: 20,
    startPos: [1, 1],
  },
  tileset: {
    floor:    { passable: true,  asset: "floor"    },
    wall:     { passable: false, asset: "wall"     },
    exit:     { passable: true,  asset: "exit"     },
    entrance: { passable: true,  asset: "entrance" },
    door:     { passable: false, asset: "door"     }
  },
  map: [
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"],
    ["wall","entrance","floor","floor","floor","floor","floor","floor","door","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","wall"],
    ["wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall"],
    ["wall","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","wall","floor","wall"],
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","floor","wall"],
    ["wall","floor","floor","floor","floor","door","floor","floor","floor","floor","floor","floor","floor","floor","floor","wall","floor","wall","floor","wall"],
    ["wall","floor","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","floor","wall","floor","wall"],
    ["wall","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","door","floor","floor","floor","wall","floor","floor","floor","wall"],
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","floor","wall","wall","wall","floor","wall"],
    ["wall","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","wall","floor","floor","floor","wall","floor","wall"],
    ["wall","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","floor","wall","wall","wall","floor","wall","exit","wall"],
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"]
  ],
  events: {
    "2,1":  { type:"enemy", data: createEnemy('spider',   { name:"Araña Mutante",          hp:12, atk:5,  def:2, gold:6,  xp:10 })},
    "3,6":  { type:"enemy", data: createEnemy('goblin',   { name:"Goblin Élite",           hp:16, atk:6,  def:3, gold:11, xp:15 })},
    "3,12": { type:"enemy", data: createEnemy('skeleton', { name:"Esqueleto Justiciero",   hp:18, atk:7,  def:3, gold:11, xp:17 })},
    "5,8":  { type:"enemy", data: createEnemy('goblin',   { name:"Goblin Berserker",       hp:18, atk:7,  def:3, gold:13, xp:18 })},
    "5,12": { type:"enemy", data: createEnemy('skeleton', { name:"Caballero Maldito",      hp:22, atk:9,  def:4, gold:16, xp:24 })},
    "6,14": { type:"enemy", data: createEnemy('troll',    { name:"Troll de la Cripta",     hp:24, atk:8,  def:4, gold:15, xp:22 })},
    "7,6":  { type:"enemy", data: createEnemy('goblin',   { name:"Goblin Chamán Oscuro",   hp:20, atk:8,  def:3, gold:16, xp:22 })},
    "7,13": { type:"enemy", data: createEnemy('skeleton', { name:"Rey Esqueleto",          hp:26, atk:10, def:4, gold:20, xp:30 })},
    "9,4":  { type:"enemy", data: createEnemy('troll',    { name:"Troll Guardián",         hp:30, atk:9,  def:5, gold:22, xp:30 })},
    "9,10": { type:"enemy", data: createEnemy('skeleton', { name:"Espectro Real",          hp:28, atk:11, def:5, gold:22, xp:32 })},
    "10,16":{ type:"enemy", data: createEnemy('dragon',   { name:"Rey Demonio Dragón",     hp:42, atk:12, def:6, gold:55, xp:65 })},
    "1,5":  { type:"treasure", data:{ gold:20, msg:"Un cofre de plata. ¡20 monedas de oro!" }},
    "5,14": { type:"treasure", data:{ gold:28, msg:"Un cofre de un cruzado. +28 oro", xp:10 }},
    "9,15": { type:"treasure", data:{ gold:40, msg:"El tesoro del Rey Demonio. ¡40 monedas de oro!", xp:18 }},
    "3,15": { type:"potion",   data:{ hp:12,  msg:"Una poción de vida. Recuperás 12 HP." }},
    "7,17": { type:"potion",   data:{ hp:14,  msg:"Una poción mágica. Recuperás 14 HP." }},
    "1,10": { type:"trap",     data:{ dmg:6,  msg:"¡Suelo con runas malditas! Recibís 6 de daño." }},
    "5,2":  { type:"trap",     data:{ dmg:8,  msg:"¡Una trampa arcana! Recibís 8 de daño." }},
    "8,14": { type:"trap",     data:{ dmg:7,  msg:"¡Flechas envenenadas! Recibís 7 de daño." }},
    "7,3":  { type:"npc",     data:{ name:"Hechicero Neutral", msg:"Llegaste más lejos que la mayoría. Tomá lo que necesites.", items:[
      { type:"potion", hp:15,  price:18, stock: 3 },
      { type:"weapon", name:"Espada mágica",  atk:3, price:38, stock: 1 },
      { type:"weapon", name:"Martillo de guerra", atk:4, price:50, stock: 1 },
      { type:"armor",  name:"Escudo de acero", def:2, price:25, stock: 1 },
      { type:"armor",  name:"Yelmo encantado", def:3, price:35, stock: 1 }
    ]}}
  }
};
