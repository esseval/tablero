import { PLAYER_BASE } from '../player.js';

export default {
  meta: {
    name: "La Cámara del Rey Demonio",
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
    ["wall","entrance","floor","floor","wall","floor","floor","floor","floor","wall","floor","wall"],
    ["wall","floor","wall","floor","floor","floor","wall","wall","floor","floor","floor","wall"],
    ["wall","floor","wall","wall","wall","floor","floor","wall","floor","wall","floor","wall"],
    ["wall","floor","floor","floor","floor","floor","wall","wall","floor","wall","floor","wall"],
    ["wall","wall","wall","wall","floor","wall","floor","floor","floor","floor","floor","wall"],
    ["wall","floor","floor","wall","floor","wall","floor","wall","wall","wall","floor","wall"],
    ["wall","floor","wall","floor","floor","floor","floor","wall","floor","floor","floor","wall"],
    ["wall","floor","wall","wall","wall","floor","wall","floor","floor","wall","floor","wall"],
    ["wall","floor","floor","floor","wall","floor","floor","floor","wall","floor","floor","wall"],
    ["wall","wall","floor","wall","floor","floor","wall","floor","floor","floor","exit","wall"],
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"]
  ],
  events: {
    "1,2": { type:"enemy",    data:{ id:"spider",      name:"Araña Mutante",   hp:12, maxHp:12, atk:5, def:2, gold:6,  xp:10 }},
    "3,5": { type:"enemy",    data:{ id:"skeleton", name:"Espectro",       hp:18, maxHp:18, atk:8, def:3, gold:12, xp:18 }},
    "4,3": { type:"enemy",    data:{ id:"skeleton", name:"Caballero Maldito", hp:22, maxHp:22, atk:9, def:4, gold:15, xp:22 }},
    "6,1": { type:"enemy",    data:{ id:"troll",    name:"Troll Ancestral",hp:28, maxHp:28, atk:9, def:5, gold:20, xp:28 }},
    "6,6": { type:"enemy",    data:{ id:"troll",    name:"Golem de Piedra",hp:30, maxHp:30, atk:9, def:6, gold:22, xp:30 }},
    "7,9": { type:"enemy",    data:{ id:"troll",    name:"Guardián Final", hp:32, maxHp:32, atk:10, def:6, gold:25, xp:35 }},
    "9,3": { type:"enemy",    data:{ id:"skeleton", name:"Rey Esqueleto",  hp:26, maxHp:26, atk:10, def:4, gold:18, xp:28 }},
    "1,6": { type:"enemy",    data:{ id:"goblin",   name:"Goblin Élite",     hp:18, maxHp:18, atk:7, def:3, gold:13, xp:18 }},
    "5,7": { type:"enemy",    data:{ id:"goblin",   name:"Jefe Goblin",      hp:22, maxHp:22, atk:8, def:3, gold:16, xp:22 }},
    "10,9":{ type:"enemy",    data:{ id:"dragon",   name:"Dragón Guardián",  hp:40, maxHp:40, atk:11, def:6, gold:50, xp:60 }},
    "1,9": { type:"treasure", data:{ gold:20, msg:"Oro de un héroe caído. ¡20 monedas!" }},
    "2,10":{ type:"treasure", data:{ gold:25, msg:"Un cofre real. ¡25 monedas de oro!", xp:8 }},
    "7,10":{ type:"treasure", data:{ gold:35, msg:"El tesoro del Rey. ¡35 monedas de oro!", xp:15 }},
    "3,8": { type:"potion",   data:{ hp:12,  msg:"Una poción de vida. Recuperás 12 HP." }},
    "5,10":{ type:"potion",   data:{ hp:10,  msg:"Una poción mágica. Recuperás 10 HP." }},
    "8,10":{ type:"potion",   data:{ hp:15,  msg:"Una poción élfica. Recuperás 15 HP." }},
    "7,3": { type:"npc",     data:{ name:"Hechicero Neutral", msg:"Pocos llegan hasta aquí. Te vendo esto por lo que vale.", items:[
      { type:"potion", hp:15,  price:18 },
      { type:"weapon", name:"Espada mágica", atk:3, price:38 }
    ]}},
    "2,4": { type:"trap",     data:{ dmg:6,  msg:"¡Suelo con runas malditas! Recibís 6 de daño." }},
    "5,9": { type:"trap",     data:{ dmg:8,  msg:"¡Una trampa arcana! Recibís 8 de daño." }},
    "9,9": { type:"trap",     data:{ dmg:7,  msg:"¡Flechas envenenadas! Recibís 7 de daño." }}
  }
};
