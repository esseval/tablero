# Ejercicios — Dungeon Explorer

✅ = implementado &nbsp;&nbsp;—&nbsp;&nbsp; ☐ = pendiente

Cada ejercicio propone una mejora concreta al juego. Están ordenados de menor
a mayor complejidad. Los ejemplos muestran el punto de partida y una dirección
posible, no la solución completa.

Con la arquitectura modular ES6, cada ejercicio indica en qué módulo(s) trabajar.

---

✅ ## 1. Venta de armadura en el NPC

**Objetivo:** Extender el sistema de compra para mejorar la defensa del jugador,
siguiendo el mismo patrón que las armas.

**Archivos modificados:** `js/game.js`, `level/level*.js`

```js
// En buyItem() — js/game.js:
} else if (item.type === 'armor') {
  G.player.def += item.def;
  log(`🛡 Compraste ${item.name}. DEF: ${G.player.def} | Oro: ${G.player.gold}`, 'ok');
}

// En itemLabel() — js/game.js:
if (item.type === 'armor') return `${item.name} +${item.def} DEF (${item.price} oro)`;

// En un nivel, dentro del NPC:
{ type: "armor", name: "Escudo de madera", def: 1, price: 15 }
```

---

✅ ## 2. Límite de compras por ítem

**Objetivo:** Que cada ítem del NPC solo pueda comprarse una cantidad limitada de veces,
evitando que el jugador acumule stats infinitos.

**Archivos modificados:** `js/game.js`, `js/events.js`, `level/level*.js`

```js
// En el nivel:
{ type: "weapon", name: "Espada corta", atk: 2, price: 22, stock: 1 }

// En buyItem() — js/game.js:
if (item.stock !== undefined) item.stock--;

// En EVENT_HANDLERS.npc — js/events.js, filtra los ítems agotados:
npc(state, key, data) {
  const available = data.items.filter(item => item.stock === undefined || item.stock > 0);
  return { shop: { ...data, items: available } };
},
```

---

✅ ## 3. Sistema de XP y nivel del jugador

**Objetivo:** Que el jugador acumule experiencia al derrotar enemigos, abrir cofres
y completar niveles, y suba de nivel automáticamente.

**Archivos modificados:** `player.js`, `js/combat.js`, `js/events.js`, `js/game.js`, `js/hud.js`, `index.html`

**Cómo quedó:** `xp` y `level` son parte del estado base del jugador
(`PLAYER_BASE` en `player.js`), así que cada nivel los hereda sin tocar `initState`.
El umbral y el chequeo de nivel viven en `combat.js`, junto al resto de las
reglas de combate:

```js
// js/combat.js
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
```

`resolveAttackRound` (combate) y el handler `treasure` (`js/events.js`) suman xp
y llaman a `checkLevelUp`, devolviendo `xpGained`/`leveledUp`/`newLevel` en su
resultado. `winGame()` (`js/game.js`) suma 1 xp extra al completar un nivel.
Quien despacha esos resultados (`handleEvent`, `tryAttack`, `tryOpen` en
`js/game.js`) es responsable de loguear el mensaje:

```js
if (result.xpGained)  log(`✨ +${result.xpGained} XP`, 'loot');
if (result.leveledUp) log(`⭐ ¡Subiste al nivel ${result.newLevel}! +2 HP máximo`, 'ok');
```

`hud.js` importa `xpThreshold` de `combat.js` para pintar la barra de XP.

---

☐ ## 4. Guardado automático con localStorage

**Objetivo:** Persistir el estado de la partida para que el jugador pueda cerrar
el browser y continuar desde donde estaba.

**Archivos a modificar:** `js/game.js`, `js/state.js`

**Pista:** `visited`, `revealed`, `visible` y `searched` son `Set`; `dim` es un
`Map`. Hay que serializarlos manualmente. `currentIndex` vive como variable de
módulo en `game.js`, no en `G`, así que hay que incluirlo aparte en el snapshot.

```js
// Funciones nuevas en js/game.js:
function saveGame() {
  const snapshot = {
    ...G,
    visited:    [...G.visited],
    revealed:   [...G.revealed],
    visible:    [...G.visible],
    dim:        [...G.dim],
    searched:   [...G.searched],
    levelIndex: currentIndex,
  };
  localStorage.setItem('dungeon_save', JSON.stringify(snapshot));
}

function loadGame() {
  const raw = localStorage.getItem('dungeon_save');
  if (!raw) return null;
  const s = JSON.parse(raw);
  s.visited  = new Set(s.visited);
  s.revealed = new Set(s.revealed);
  s.visible  = new Set(s.visible);
  s.dim      = new Map(s.dim);
  s.searched = new Set(s.searched);
  return s;
}

// Llamar saveGame() al final de tryMove(), tryAttack(), tryOpen() y trySearch().
// Llamar loadGame() al inicio de restartGame() para restaurar si hay guardado.
```

---

✅ ## 5. Minimapa

**Objetivo:** Mostrar un minimapa en el HUD que revele las celdas visitadas
como píxeles de colores.

**Archivos modificados:** `js/renderer.js`, `index.html`, `css/style.css`

**Cómo quedó:** un `<canvas id="minimap">` sin tamaño fijo en el HTML; el
tamaño de grilla se ajusta en JS (1 px por celda) y el estilo visual
(`width`, `height`, `image-rendering: pixelated`) vive en `css/style.css`.
`renderMinimap` es una función interna de `renderer.js` (no exportada),
llamada al final de `render()`:

```js
// css/style.css
#minimap { width: 96px; height: 96px; image-rendering: pixelated; border: 1px solid #333; }

// js/renderer.js
function renderMinimap(state) {
  const canvas = document.getElementById('minimap');
  if (!canvas) return;
  const rows = state.board.map.length;
  const cols = state.board.map[0].length;
  canvas.width  = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d');
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      if (!state.revealed.has(key))            ctx.fillStyle = '#000';
      else if (state.board.map[r][c] === 'wall') ctx.fillStyle = '#4a3828';
      else if (state.board.map[r][c] === 'exit') ctx.fillStyle = '#1a9a3a';
      else                                        ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(c, r, 1, 1);
    }
  }
  ctx.fillStyle = '#4a90d9';
  ctx.fillRect(state.pos[1], state.pos[0], 1, 1);
}

// En render() — js/renderer.js, al final:
renderMinimap(state);
```

---

☐ ## 6. Movimiento de enemigos

**Objetivo:** Que los enemigos se muevan un paso por turno hacia el jugador
cuando están dentro del área revelada (`G.revealed`).

**Archivos a modificar:** `js/game.js`

**Pista:** los enemigos ya bloquean el paso del jugador en `tryMove` (una
celda con `type: 'enemy'` no se puede pisar; el combate se dispara aparte con
`tryAttack`, al clickear una celda adyacente). Este ejercicio agrega el lado
inverso: que el enemigo avance hacia el jugador. Iterar `G.events`, filtrar
los de tipo `enemy` dentro de `G.revealed`, y moverlos un paso con distancia
Manhattan. Llamar a `moveEnemies()` al final de `tryMove`, antes de `render`.
Si un enemigo termina adyacente al jugador (o sobre su celda), definir cómo se
resuelve — por ejemplo, disparando `resolveAttackRound` directamente en vez de
esperar el click del jugador.

```js
// Función nueva en js/game.js:
function moveEnemies() {
  const [pr, pc] = G.pos;
  Object.entries(G.events).forEach(([key, ev]) => {
    if (ev.type !== 'enemy' || !G.revealed.has(key)) return;
    const [er, ec] = key.split(',').map(Number);
    const dr = Math.sign(pr - er);
    const dc = Math.sign(pc - ec);
    const newKey = `${er + dr},${ec + dc}`;
    if (newKey === `${pr},${pc}`) return; // no pisa al jugador — resolver combate acá
    const tileId = G.board.map[er + dr]?.[ec + dc];
    const tile = G.board.tileset[tileId];
    if (tile?.passable && !G.events[newKey]) {
      G.events[newKey] = ev;
      delete G.events[key];
    }
  });
}
```

---

☐ ## 7. Nuevo tipo de tile: agua

**Objetivo:** Agregar un tile de agua que sea pasable pero cause 1 de daño por turno.

**Archivos a modificar:** `js/game.js`, `level/level*.js`, `assets/water.png`

**Pista:** extender el tileset del nivel y agregar la lógica en `tryMove`,
junto a los otros chequeos de `tileId` que ya existen ahí (`exit`, `entrance`).
Los assets se sirven como `assets/<id>.png` (ver `getEventAssetId` /
`render()` en `renderer.js`), así que alcanza con agregar `water.png`.

```js
// En el tileset del nivel:
water: { passable: true, asset: "water" }

// En tryMove() — js/game.js, junto a los demás chequeos de tileId:
} else if (tileId === 'water') {
  G.player.hp -= 1;
  log('🌊 El agua fría te quema. -1 HP', 'danger');
  if (G.player.hp <= 0) { render(G, boardEl()); updateHUD(G); gameOver(); return; }
}
```

---

☐ ## 8. Animación de daño

**Objetivo:** Mostrar un flash rojo en la celda del jugador al recibir daño
y un flash amarillo al recoger oro o pociones.

**Archivos a modificar:** `js/renderer.js`, `js/game.js`, `css/style.css`

**Pista:** `cellEl` ya existe en `renderer.js` pero no está exportada —
exportarla o agregar una función `flashCell` junto a ella. Los puntos de
llamada ahora están repartidos entre `tryAttack()` (daño de combate),
`handleEvent()` (trampas y pociones) y `tryOpen()` (cofres), según el `cls`
que devuelve cada resultado (`'danger'` = daño, `'loot'`/`'ok'` = beneficio).

```css
/* En style.css */
.cell.flash-dmg  { animation: flash-dmg  .35s ease-out; }
.cell.flash-loot { animation: flash-loot .35s ease-out; }

@keyframes flash-dmg  { 0%{ filter:brightness(3) sepia(1) hue-rotate(-20deg) } 100%{ filter:none } }
@keyframes flash-loot { 0%{ filter:brightness(3) sepia(1) hue-rotate(30deg)  } 100%{ filter:none } }
```

```js
// Función nueva en js/renderer.js:
export function flashCell(r, c, cls) {
  const el = cellEl(r, c);
  if (!el) return;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 350);
}

// En tryAttack() — js/game.js, después de resolveAttackRound:
if (!result.playerDied && result.lines.some(l => l.cls === 'combat')) flashCell(...G.pos, 'flash-dmg');

// En handleEvent() — js/game.js, según el resultado:
if (result.cls === 'danger') flashCell(G.pos[0], G.pos[1], 'flash-dmg');
if (result.cls === 'loot' || result.cls === 'ok') flashCell(G.pos[0], G.pos[1], 'flash-loot');
```

---

✅ ## 9. Descripción emergente al pasar el mouse

**Objetivo:** Mostrar un tooltip con el nombre y stats del enemigo (o el nombre
del NPC) al hacer hover sobre una celda visible.

**Archivos modificados:** `js/renderer.js`, `js/game.js`

**Cómo quedó:** `buildBoard` recibe un cuarto parámetro `getState` — una
función que devuelve el estado actual — en vez de acoplarse a un estado fijo
por closure. El listener `mouseenter` se registra una sola vez por celda al
construir el tablero, y solo pinta el `title` si la celda está en
`state.visible` (el cono de visión del turno actual, no `revealed`):

```js
// En buildBoard() — js/renderer.js, al crear cada celda:
cell.addEventListener('mouseenter', () => {
  if (!getState) return;
  const st = getState();
  if (!st) return;
  const key = `${r},${c}`;
  if (!st.visible?.has(key)) return;
  const ev = st.events?.[key];
  if (!ev) return;
  if (ev.type === 'enemy') {
    cell.title = `${ev.data.name} | HP: ${ev.data.hp} ATK: ${ev.data.atk} DEF: ${ev.data.def}`;
  } else if (ev.type === 'npc') {
    cell.title = ev.data.name;
  }
});

// En game.js, cada llamado a buildBoard pasa () => G como cuarto argumento:
buildBoard(G.board, boardEl(), onCellClick, () => G);
```

---

☐ ## 10. Editor de niveles en el browser

**Objetivo:** Agregar un modo "editor" que permita diseñar un nivel visualmente
haciendo click en las celdas para cambiar su tipo, y exportarlo como JSON.

**Archivos a modificar:** `js/game.js`, `index.html`, `css/style.css`

**Pista:** el estado del editor vive en `game.js`. `onCellClick(r, c)` ya
decide entre `tryAttack`/`tryOpen`/`tryMove` según el evento de la celda
clickeada — el modo editor debe interceptar *antes* de esa decisión y, en vez
de mover al jugador, modificar `G.board.map` directamente.

```js
// Variables nuevas en js/game.js:
let editorMode = false;
let editorTile = 'wall';

export function toggleEditor() {
  editorMode = !editorMode;
  log(editorMode ? 'Modo editor activado.' : 'Modo juego activado.', 'sys');
}

// En onCellClick() — js/game.js, antes del resto de la lógica:
function onCellClick(r, c) {
  if (editorMode) {
    G.board.map[r][c] = editorTile;
    render(G, boardEl());
    return;
  }
  // ... lógica original (tryAttack / tryOpen / tryMove)
}

// Para exportar el nivel editado: reusar exportBoard(),
// que ya serializa levels[currentIndex] (= G.board).
```
