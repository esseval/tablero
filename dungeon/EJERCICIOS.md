# Ejercicios — Dungeon Explorer

✅ = implementado &nbsp;&nbsp;—&nbsp;&nbsp; ☐ = pendiente

Cada ejercicio propone una mejora concreta al juego. Están ordenados de menor
a mayor complejidad. Los ejemplos muestran el punto de partida y una dirección
posible, no la solución completa.

Con la arquitectura modular ES6, cada ejercicio indica en qué módulo(s) trabajar.

---

☐ ## 1. Venta de armadura en el NPC

**Objetivo:** Extender el sistema de compra para mejorar la defensa del jugador,
siguiendo el mismo patrón que las armas.

**Archivos a modificar:** `js/game.js`, `level/level*.js`

**Pista:** `buyItem` ya está preparado para un `else if` adicional.

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

☐ ## 2. Límite de compras por ítem

**Objetivo:** Que cada ítem del NPC solo pueda comprarse una cantidad limitada de veces,
evitando que el jugador acumule stats infinitos.

**Archivos a modificar:** `js/game.js`, `js/events.js`, `level/level*.js`

**Pista:** Agregar un campo `stock` al ítem y decrementarlo al comprar.

```js
// En el nivel:
{ type: "weapon", name: "Espada corta", atk: 2, price: 22, stock: 1 }

// En buyItem() — js/game.js:
if (item.stock !== undefined) item.stock--;

// En EVENT_HANDLERS.npc — js/events.js, filtrar ítems agotados:
npc(state, key, data) {
  const available = data.items.filter(item => item.stock === undefined || item.stock > 0);
  return { shop: { ...data, items: available } };
},
```

---

☐ ## 3. Sistema de XP y nivel del jugador

**Objetivo:** Que el jugador acumule experiencia al derrotar enemigos y suba de nivel,
incrementando sus stats automáticamente.

**Archivos a modificar:** `js/state.js`, `js/events.js`, `js/game.js`, `js/hud.js`, `index.html`, `css/style.css`

**Pista:** Agregar `xp` y `level` al estado del jugador en `initState`. Verificar
si sube de nivel en `handleEvent` después de un combate ganado.

```js
// En initState() — js/state.js:
player: { ...m.player, xp: 0, level: 1 }

// Función nueva en js/game.js:
function checkLevelUp() {
  const p = G.player;
  const threshold = p.level * 20;
  if (p.xp < threshold) return;
  p.level++;
  p.maxHp += 5;
  p.hp = Math.min(p.hp + 5, p.maxHp);
  p.atk++;
  log(`⭐ ¡Subiste al nivel ${p.level}! ATK +1, HP +5`, 'ok');
}

// En handleEvent() — js/game.js, al procesar resultado de enemy:
if (result.lines) result.lines.forEach(l => log(l.txt, l.cls));
if (result.died) { gameOver(); return; }
G.player.xp += (result.xp ?? 0);
checkLevelUp();

// En EVENT_HANDLERS.enemy — js/events.js, incluir xp en el retorno:
return { lines: result.lines, died: !result.won, xp: data.xp ?? 0 };

// En updateHUD() — js/hud.js:
document.getElementById('stat-xp-val').textContent = `${p.xp} / ${p.level * 20}`;
```

---

☐ ## 4. Guardado automático con localStorage

**Objetivo:** Persistir el estado de la partida para que el jugador pueda cerrar
el browser y continuar desde donde estaba.

**Archivos a modificar:** `js/game.js`, `js/state.js`

**Pista:** `visited` y `revealed` son `Set`; hay que serializarlos manualmente.

```js
// Funciones nuevas en js/game.js:
function saveGame() {
  const snapshot = {
    ...G,
    visited:    [...G.visited],
    revealed:   [...G.revealed],
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
  return s;
}

// Llamar saveGame() al final de tryMove().
// Llamar loadGame() al inicio de restartGame() para restaurar si hay guardado.
```

---

✅ ## 5. Minimapa

**Objetivo:** Mostrar un minimapa en el HUD que revele las celdas visitadas
como píxeles de colores.

**Archivos a modificar:** `js/renderer.js`, `index.html`, `css/style.css`

**Pista:** Usar un `<canvas>` de baja resolución (1 px por celda). Agregar la
llamada a `renderMinimap` al final de `render()`.

```js
// En index.html, dentro del HUD:
// <canvas id="minimap" width="12" height="12"
//   style="width:96px;height:96px;image-rendering:pixelated;border:1px solid #333">
// </canvas>

// Función nueva en js/renderer.js:
export function renderMinimap(state) {
  const canvas = document.getElementById('minimap');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const map = state.board.map;
  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[0].length; c++) {
      const key = `${r},${c}`;
      if (!state.revealed.has(key))  ctx.fillStyle = '#000';
      else if (map[r][c] === 'wall') ctx.fillStyle = '#4a3828';
      else if (map[r][c] === 'exit') ctx.fillStyle = '#1a9a3a';
      else                           ctx.fillStyle = '#2a2a2a';
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
cuando están dentro del rango de visión.

**Archivos a modificar:** `js/game.js`

**Pista:** Después de que el jugador se mueve, iterar los eventos tipo `enemy`
que estén en celdas `revealed` y moverlos un paso usando distancia Manhattan.
Llamar a `moveEnemies(G)` al final de `tryMove`, antes de `render`.

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

**Archivos a modificar:** `js/game.js`, `level/level*.js`, `assets/water.svg`

**Pista:** Extender el tileset del nivel y agregar lógica en `tryMove`, después
de actualizar la posición.

```js
// En el tileset del nivel:
water: { passable: true, asset: "water" }

// En tryMove() — js/game.js, después de actualizar pos:
if (tileId === 'water') {
  G.player.hp -= 1;
  log('🌊 El agua fría te quema. -1 HP', 'danger');
  if (G.player.hp <= 0) { gameOver(); return; }
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

☐ ## 8. Animación de daño

**Objetivo:** Mostrar un flash rojo en la celda del jugador al recibir daño
y un flash amarillo al recoger oro.

**Archivos a modificar:** `js/renderer.js`, `js/game.js`, `css/style.css`

**Pista:** `flashCell` vive en `renderer.js` (tiene acceso a `cellEl`).
`game.js` la importa y la llama desde `handleEvent` según el resultado del handler.

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
  const el = document.querySelector(`#board .cell[data-r="${r}"][data-c="${c}"]`);
  if (!el) return;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 350);
}

// En handleEvent() — js/game.js, según el resultado:
if (result.cls === 'danger') flashCell(G.pos[0], G.pos[1], 'flash-dmg');
if (result.cls === 'loot')   flashCell(G.pos[0], G.pos[1], 'flash-loot');
```

---

✅ ## 9. Descripción emergente al pasar el mouse

**Objetivo:** Mostrar un tooltip con el nombre y stats del enemigo
al hacer hover sobre una celda visible.

**Archivos a modificar:** `js/renderer.js`

**Pista:** Agregar el listener `mouseenter` en `buildBoard`, que ya recibe
el estado a través del closure o como parámetro adicional.

```js
// En buildBoard() — js/renderer.js, al crear cada celda:
cell.addEventListener('mouseenter', e => {
  const key = `${r},${c}`;
  if (!state?.revealed.has(key)) return;
  const ev = state.events?.[key];
  if (!ev) return;
  if (ev.type === 'enemy') {
    e.currentTarget.title =
      `${ev.data.name} | HP: ${ev.data.hp} ATK: ${ev.data.atk} DEF: ${ev.data.def}`;
  } else if (ev.type === 'npc') {
    e.currentTarget.title = ev.data.name;
  }
});
```

> Para que `state` esté disponible en el closure, `buildBoard` puede recibir
> una función `getState` en lugar del estado directamente:
> `buildBoard(boardData, container, onCellClick, getState)`

---

☐ ## 10. Editor de niveles en el browser

**Objetivo:** Agregar un modo "editor" que permita diseñar un nivel visualmente
haciendo click en las celdas para cambiar su tipo, y exportarlo como JSON.

**Archivos a modificar:** `js/game.js`, `index.html`, `css/style.css`

**Pista:** El estado del editor vive en `game.js`. En `onCellClick`, si el modo
está activo, modificar `G.board.map` en vez de mover al jugador.

```js
// Variables nuevas en js/game.js:
let editorMode = false;
let editorTile = 'wall';

export function toggleEditor() {
  editorMode = !editorMode;
  log(editorMode ? 'Modo editor activado.' : 'Modo juego activado.', 'sys');
}

// En onCellClick() — js/game.js:
function onCellClick(r, c) {
  if (editorMode) {
    G.board.map[r][c] = editorTile;
    render(G, document.getElementById('board'));
    return;
  }
  // ... lógica original
}

// Para exportar el nivel editado: reusar exportBoard(),
// que ya serializa levels[currentIndex] (= G.board).
```
