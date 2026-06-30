import { PLAYER_BASE } from '../player.js';

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
    "2,1": { type:"enemy",    data:{ id:"spider",      name:"Araña",         hp:6,  maxHp:6,  atk:3, def:1, gold:3,  xp:5  }},
    "3,5": { type:"enemy",    data:{ id:"spider",      name:"Araña Gigante", hp:8,  maxHp:8,  atk:4, def:1, gold:4,  xp:7  }},
    "5,3": { type:"enemy",    data:{ id:"skeleton", name:"Esqueleto",    hp:12, maxHp:12, atk:5, def:3, gold:8,  xp:12 }},
    "7,5": { type:"enemy",    data:{ id:"skeleton", name:"Esqueleto",    hp:10, maxHp:10, atk:6, def:2, gold:7,  xp:10 }},
    "5,8": { type:"enemy",    data:{ id:"troll",    name:"Troll",        hp:18, maxHp:18, atk:7, def:5, gold:15, xp:20 }},
    "9,5": { type:"enemy",    data:{ id:"skeleton", name:"Esqueleto",    hp:14, maxHp:14, atk:6, def:3, gold:10, xp:14 }},
    "9,8": { type:"enemy",    data:{ id:"troll",    name:"Guardián",     hp:22, maxHp:22, atk:8, def:6, gold:20, xp:25 }},
    "4,5": { type:"enemy",    data:{ id:"goblin",   name:"Goblin",           hp:7,  maxHp:7,  atk:4, def:2, gold:5,  xp:6  }},
    "6,6": { type:"enemy",    data:{ id:"goblin",   name:"Goblin Merodeador",hp:9,  maxHp:9,  atk:4, def:2, gold:6,  xp:8  }},
    "1,6": { type:"treasure", data:{ gold:12, msg:"Un cofre polvoriento. ¡12 monedas de oro!" }},
    "3,9": { type:"treasure", data:{ gold:8,  msg:"Monedas dispersas por el suelo. +8 oro" }},
    "7,9": { type:"treasure", data:{ gold:20, msg:"Un cofre sellado. ¡20 monedas de oro!", xp:5 }},
    "1,9": { type:"potion",   data:{ hp:8,   msg:"Una poción de vida. Recuperás 8 HP." }},
    "6,5": { type:"potion",   data:{ hp:6,   msg:"Una poción débil. Recuperás 6 HP." }},
    "9,2": { type:"potion",   data:{ hp:10,  msg:"Una poción fuerte. Recuperás 10 HP." }},
    "1,3": { type:"npc",     data:{ name:"Mercader Errante", msg:"¡Bienvenido, aventurero! ¿Qué necesitás?", items:[
      { type:"potion", hp:10,  price:8,  },
      { type:"weapon", name:"Daga oxidada",  atk:1, price:12 },
      { type:"armor",  name:"Escudo de madera", def:1, price:15 }
    ]}},
    "2,9": { type:"trap",     data:{ dmg:4,  msg:"¡Una trampa de pinchos! Recibís 4 de daño." }},
    "4,8": { type:"trap",     data:{ dmg:6,  msg:"¡El suelo cede! Caés y recibís 6 de daño." }},
    "7,2": { type:"trap",     data:{ dmg:5,  msg:"¡Una trampa oculta! Recibís 5 de daño." }}
  }
};
