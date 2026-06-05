# Ejercicios — Dungeon Explorer

Cada ejercicio propone una mejora concreta al juego. Están ordenados de menor
a mayor complejidad. Los ejemplos muestran el punto de partida y una dirección
posible, no la solución completa.

---

## 1. Venta de armadura en el NPC

**Objetivo:** Extender el sistema de compra para mejorar la defensa del jugador,
siguiendo el mismo patrón que las armas.

**Archivos a modificar:** `js/game.js`, `level/level*.js`

**Pista:** `buyItem` ya está preparado para un `else if` adicional.

```js
// En buyItem(), agregar:
} else if (item.type === 'armor') {
  state.player.def += item.def;
  log(`🛡 Compraste ${item.name}. DEF: ${state.player.def} | Oro: ${state.player.gold}`, 'ok');
}

// En itemLabel(), agregar:
if (item.type === 'armor') return `${item.name} +${item.def} DEF (${item.price} oro)`;

// En un nivel, dentro del NPC:
{ type: "armor", name: "Escudo de madera", def: 1, price: 15 }
```

---

## 2. Límite de compras por ítem

**Objetivo:** Que cada ítem del NPC solo pueda comprarse una cantidad limitada de veces,
evitando que el jugador acumule stats infinitos.

**Archivos a modificar:** `js/game.js`, `level/level*.js`

**Pista:** Agregar un campo `stock` al ítem y decrementarlo al comprar.
El botón debe deshabilitarse o desaparecer cuando `stock === 0`.

```js
// En el nivel:
{ type: "weapon", name: "Espada corta", atk: 2, price: 22, stock: 1 }

// En buyItem(), al final de la compra:
if (item.stock !== undefined) item.stock--;

// En EVENT_HANDLERS.npc, filtrar ítems con stock agotado:
const btns = data.items
  .filter(item => item.stock === undefined || item.stock > 0)
  .map(item => ({ ... }));
```

---

## 3. Sistema de XP y nivel del jugador

**Objetivo:** Que el jugador acumule experiencia al derrotar enemigos y suba de nivel,
incrementando sus stats automáticamente.

**Archivos a modificar:** `js/game.js`, `js/game.js` (HUD), `index.html`, `css/style.css`

**Pista:** Agregar `xp` y `level` al estado del jugador. Verificar si sube de nivel
después de cada combate ganado.

```js
// En initState(), extender player:
player: { ...m.player, xp: 0, level: 1 }

// Función nueva:
function checkLevelUp(state) {
  const threshold = state.player.level * 20;
  if (state.player.xp < threshold) return;
  state.player.level++;
  state.player.maxHp += 5;
  state.player.hp = Math.min(state.player.hp + 5, state.player.maxHp);
  state.player.atk++;
  log(`⭐ ¡Subiste al nivel ${state.player.level}! ATK +1, HP +5`, 'ok');
}

// En EVENT_HANDLERS.enemy, al ganar:
state.player.xp += data.xp;
checkLevelUp(state);
```

---

## 4. Guardado automático con localStorage

**Objetivo:** Persistir el estado de la partida para que el jugador pueda cerrar
el browser y continuar desde donde estaba.

**Archivos a modificar:** `js/game.js`

**Pista:** `visited` y `revealed` son `Set`; hay que serializarlos manualmente.

```js
function saveGame(state) {
  const snapshot = {
    ...state,
    visited:  [...state.visited],
    revealed: [...state.revealed],
    levelIndex: currentLevelIndex,
  };
  localStorage.setItem('dungeon_save', JSON.stringify(snapshot));
}

function loadGame() {
  const raw = localStorage.getItem('dungeon_save');
  if (!raw) return null;
  const s = JSON.parse(raw);
  s.visited  = new Set(s.visited);
  s.revealed = new Set(s.revealed);
  return s;
}

// Llamar saveGame(G) al final de tryMove(), y loadGame() al inicio de restartGame().
```

---

## 5. Minimapa

**Objetivo:** Mostrar un minimapa en el HUD que revele las celdas visitadas
como píxeles de colores.

**Archivos a modificar:** `js/game.js`, `index.html`, `css/style.css`

**Pista:** Usar un `<canvas>` de baja resolución (1 px por celda).

```js
// En index.html, dentro del HUD:
// <canvas id="minimap" width="12" height="12"
//   style="width:96px;height:96px;image-rendering:pixelated;border:1px solid #333">
// </canvas>

function renderMinimap() {
  const canvas = document.getElementById('minimap');
  const ctx = canvas.getContext('2d');
  const map = G.board.map;
  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[0].length; c++) {
      const key = r + ',' + c;
      if (!G.revealed.has(key)) { ctx.fillStyle = '#000'; }
      else if (map[r][c] === 'wall') { ctx.fillStyle = '#4a3828'; }
      else if (map[r][c] === 'exit') { ctx.fillStyle = '#1a9a3a'; }
      else { ctx.fillStyle = '#2a2a2a'; }
      ctx.fillRect(c, r, 1, 1);
    }
  }
  // Jugador
  ctx.fillStyle = '#4a90d9';
  ctx.fillRect(G.pos[1], G.pos[0], 1, 1);
}

// Llamar renderMinimap() al final de render().
```

---

## 6. Movimiento de enemigos

**Objetivo:** Que los enemigos se muevan un paso por turno hacia el jugador
cuando están dentro del rango de visión.

**Archivos a modificar:** `js/game.js`

**Pista:** Después de que el jugador se mueve, iterar los eventos tipo `enemy`
que estén en celdas `revealed` y moverlos un paso usando distancia Manhattan.

```js
function moveEnemies(state) {
  const [pr, pc] = state.pos;
  Object.entries(state.events).forEach(([key, ev]) => {
    if (ev.type !== 'enemy' || !state.revealed.has(key)) return;
    const [er, ec] = key.split(',').map(Number);
    const dr = Math.sign(pr - er);
    const dc = Math.sign(pc - ec);
    // Intentar mover primero en el eje con mayor distancia
    const newKey = `${er + dr},${ec + dc}`;
    const tileId = state.board.map[er + dr]?.[ec + dc];
    const tile = state.board.tileset[tileId];
    if (tile?.passable && !state.events[newKey]) {
      state.events[newKey] = ev;
      delete state.events[key];
    }
  });
}

// Llamar moveEnemies(G) al final de tryMove(), antes de render().
```

---

## 7. Nuevo tipo de tile: agua

**Objetivo:** Agregar un tile de agua que sea pasable pero cause 1 de daño por turno
y ralentice al jugador (no avanza turno si ya pisó agua el turno anterior).

**Archivos a modificar:** `js/game.js`, `level/level*.js`, `assets/water.svg`

**Pista:** Extender el tileset del nivel y agregar lógica en `tryMove`.

```js
// En el tileset del nivel:
water: { passable: true, asset: "water" }

// En tryMove(), después de actualizar la posición:
if (tileId === 'water') {
  state.player.hp -= 1;
  log('🌊 El agua fría te quema. -1 HP', 'danger');
  if (state.player.hp <= 0) { gameOver(state); return; }
}
```

```svg
<!-- assets/water.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0a2a4a"/>
  <path d="M0 40 Q16 32 32 40 Q48 48 64 40 L64 64 L0 64 Z" fill="#0a4a8a" opacity=".7"/>
  <path d="M0 48 Q16 40 32 48 Q48 56 64 48 L64 64 L0 64 Z" fill="#1a6aaa" opacity=".5"/>
</svg>
```

---

## 8. Animación de daño

**Objetivo:** Mostrar un flash rojo en la celda del jugador al recibir daño
y un flash amarillo al recoger oro.

**Archivos a modificar:** `js/game.js`, `css/style.css`

**Pista:** Agregar/quitar una clase CSS con `setTimeout`.

```css
/* En style.css */
.cell.flash-dmg  { animation: flash-dmg  .35s ease-out; }
.cell.flash-loot { animation: flash-loot .35s ease-out; }

@keyframes flash-dmg  { 0%{ filter:brightness(3) sepia(1) hue-rotate(-20deg) } 100%{ filter:none } }
@keyframes flash-loot { 0%{ filter:brightness(3) sepia(1) hue-rotate(30deg)  } 100%{ filter:none } }
```

```js
// Función nueva:
function flashCell(r, c, cls) {
  const el = cellEl(r, c);
  if (!el) return;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 350);
}

// En EVENT_HANDLERS.trap:
flashCell(state.pos[0], state.pos[1], 'flash-dmg');

// En EVENT_HANDLERS.treasure:
flashCell(state.pos[0], state.pos[1], 'flash-loot');
```

---

## 9. Descripción emergente al pasar el mouse

**Objetivo:** Mostrar un tooltip con el nombre y stats del enemigo
al hacer hover sobre una celda visible.

**Archivos a modificar:** `js/game.js`, `css/style.css`

**Pista:** Usar `title` en la celda o un `<div>` de tooltip posicionado con CSS.

```js
// En buildBoard(), al crear cada celda:
cell.addEventListener('mouseenter', onCellHover);

function onCellHover(e) {
  const r = +e.currentTarget.dataset.r;
  const c = +e.currentTarget.dataset.c;
  const key = r + ',' + c;
  if (!G?.revealed.has(key)) return;
  const ev = G.events[key];
  if (!ev) return;
  if (ev.type === 'enemy') {
    e.currentTarget.title =
      `${ev.data.name} | HP: ${ev.data.hp} ATK: ${ev.data.atk} DEF: ${ev.data.def}`;
  } else if (ev.type === 'npc') {
    e.currentTarget.title = ev.data.name;
  }
}
```

---

## 10. Editor de niveles en el browser

**Objetivo:** Agregar un modo "editor" que permita diseñar un nivel visualmente
haciendo click en las celdas para cambiar su tipo, y exportarlo como JSON.

**Archivos a modificar:** `js/game.js`, `index.html`, `css/style.css`

**Pista:** Agregar un toggle `editorMode` global. En `onCellClick`, si el modo
está activo, cambiar el tile en `BOARD_DATA.map` en vez de mover al jugador.

```js
let editorMode = false;
let editorTile = 'wall'; // tile seleccionado actualmente

function toggleEditor() {
  editorMode = !editorMode;
  log(editorMode ? 'Modo editor activado.' : 'Modo juego activado.', 'sys');
}

// En onCellClick(), al inicio:
if (editorMode) {
  BOARD_DATA.map[r][c] = editorTile;
  render();
  return;
}

// Para exportar el nivel editado, reusar exportBoard().
```
