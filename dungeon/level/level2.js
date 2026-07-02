import { PLAYER_BASE } from '../player.js';

export default {
  meta: {
    name: "El Pasillo de las Sombras",
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
    ["wall","entrance","floor","floor","floor","floor","wall","floor","floor","floor","floor","wall"],
    ["wall","floor","wall","wall","wall","floor","wall","floor","wall","wall","floor","wall"],
    ["wall","floor","wall","floor","floor","floor","floor","floor","floor","wall","floor","wall"],
    ["wall","floor","wall","floor","wall","wall","wall","wall","floor","wall","floor","wall"],
    ["wall","floor","floor","floor","wall","floor","floor","wall","floor","floor","floor","wall"],
    ["wall","wall","wall","floor","wall","floor","floor","wall","floor","wall","wall","wall"],
    ["wall","floor","floor","floor","wall","floor","floor","floor","floor","wall","floor","wall"],
    ["wall","floor","wall","wall","wall","floor","wall","wall","floor","floor","floor","wall"],
    ["wall","floor","floor","floor","floor","floor","wall","floor","floor","wall","floor","wall"],
    ["wall","wall","floor","wall","wall","floor","floor","floor","wall","wall","exit","wall"],
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"]
  ],
  events: {
    "2,1": { type:"enemy",    data:{ id:"spider",      name:"Araña Venenosa",   hp:10, maxHp:10, atk:4, def:1, gold:4,  xp:8  }},
    "3,3": { type:"enemy",    data:{ id:"skeleton", name:"Esqueleto",      hp:14, maxHp:14, atk:6, def:3, gold:9,  xp:13 }},
    "5,1": { type:"enemy",    data:{ id:"skeleton", name:"Esqueleto Jefe", hp:18, maxHp:18, atk:7, def:4, gold:12, xp:16 }},
    "5,5": { type:"enemy",    data:{ id:"troll",    name:"Troll",          hp:20, maxHp:20, atk:8, def:5, gold:16, xp:22 }},
    "7,2": { type:"enemy",    data:{ id:"troll",    name:"Troll",          hp:22, maxHp:22, atk:8, def:6, gold:18, xp:24 }},
    "7,6": { type:"enemy",    data:{ id:"skeleton", name:"Espectro",       hp:16, maxHp:16, atk:8, def:3, gold:11, xp:18 }},
    "9,4": { type:"enemy",    data:{ id:"troll",    name:"Guardián",       hp:26, maxHp:26, atk:9, def:6, gold:22, xp:28 }},
    "1,4": { type:"enemy",    data:{ id:"goblin",   name:"Goblin Feroz",     hp:12, maxHp:12, atk:5, def:2, gold:8,  xp:11 }},
    "3,7": { type:"enemy",    data:{ id:"goblin",   name:"Goblin Chamán",    hp:14, maxHp:14, atk:6, def:2, gold:10, xp:14 }},
    "1,9": { type:"treasure", data:{ gold:15, msg:"Un cofre olvidado. ¡15 monedas de oro!" }},
    "7,10":{ type:"treasure", data:{ gold:18, msg:"Monedas de un aventurero caído. +18 oro", xp:5 }},
    "9,2": { type:"treasure", data:{ gold:25, msg:"Un cofre doble sellado. ¡25 monedas de oro!", xp:10 }},
    "1,8": { type:"potion",   data:{ hp:10,  msg:"Una poción de vida. Recuperás 10 HP." }},
    "5,10":{ type:"potion",   data:{ hp:8,   msg:"Una poción herbal. Recuperás 8 HP." }},
    "9,8": { type:"potion",   data:{ hp:12,  msg:"Una poción fuerte. Recuperás 12 HP." }},
    "5,9": { type:"npc",     data:{ name:"Alquimista", msg:"Las sombras son peligrosas. Tengo lo que necesitás.", items:[
      { type:"potion", hp:12,  price:12, stock: 5 },
      { type:"weapon", name:"Espada corta", atk:2, price:22, stock: 1 }, 
      { type:"armor",  name:"Casco de cuero", def:1, price:15, stock: 1 }
    ]}},
    "2,7": { type:"trap",     data:{ dmg:5,  msg:"¡Una trampa de flechas! Recibís 5 de daño." }},
    "6,5": { type:"trap",     data:{ dmg:7,  msg:"¡Una trampa de ácido! Recibís 7 de daño." }},
    "4,10":{ type:"trap",     data:{ dmg:6,  msg:"¡Una trampa oculta! Recibís 6 de daño." }}
  }
};
