# Estructura del proyecto — Dungeon Explorer

Juego de exploración de mazmorras por turnos que corre íntegramente en el browser,
sin dependencias externas. Requiere ser servido por HTTP (no funciona como `file://`
porque los módulos ES6 tienen restricciones CORS).

---

## Árbol de archivos

```
tablero/
├── index.html                  ← hub de juegos
├── shared/                     ← módulos reutilizables entre juegos
│   ├── modal.js
│   ├── log.js
│   └── storage.js
└── dungeon/
    ├── index.html
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── main.js             ← entry point
    │   ├── game.js             ← orquestador
    │   ├── state.js
    │   ├── fog.js
    │   ├── combat.js
    │   ├── events.js
    │   ├── renderer.js
    │   └── hud.js
    ├── assets/
    │   └── *.svg
    └── level/
        ├── manifest.js
        ├── level1.js
        ├── level2.js
        └── level3.js
```

---

## Módulos compartidos (`shared/`)

Reutilizables en cualquier juego bajo `tablero/`. No contienen referencias
a Dungeon ni a ningún juego específico.

### `shared/modal.js`
```js
showModal(title, body, btns)   // btns: [{ label, cls, fn }]
closeModal()
```
Muestra un overlay con título, texto y botones de acción. Cada botón cierra el modal
antes de ejecutar su `fn`.

### `shared/log.js`
```js
createLog(elementId)  // → función log(txt, cls)
```
Factory: cada juego crea su propio logger apuntando a su panel de mensajes.
La clase CSS `cls` es responsabilidad del que llama.

### `shared/storage.js`
```js
download(content, filename, type)
readJSON(evt, cb)   // cb(data, error)
```
`readJSON` pasa `(null, mensaje)` al callback si el JSON es inválido, sin
acoplar el manejo de errores al sistema de log del juego.

---

## Módulos de Dungeon (`dungeon/js/`)

### `main.js` — Entry point

Punto de entrada declarado como `<script type="module">` en `index.html`.
Responsabilidades:
- Registrar listeners de teclado (WASD / flechas) y botones de la barra IO
- Cargar los niveles con `import()` dinámico a partir del manifest
- Llamar a `restartGame(levels)` para iniciar el juego

**Flujo de carga:**
```
<script type="module" src="js/main.js">
  │
  ├─ import estático: game.js, level/manifest.js
  │
  └─ await Promise.all(
       MANIFEST.map(name => import(`../level/${name}.js`))
     )
       └─ restartGame(levels)
```

Los niveles se cargan en paralelo. Al resolverse todos, se inicia el juego.

### `game.js` — Orquestador

Maneja el estado de la partida (`G`) y la lógica que requiere coordinar
múltiples módulos. Exporta las funciones públicas que `main.js` necesita.

| Exporta | Descripción |
|---------|-------------|
| `restartGame(levelList)` | Inicia desde el nivel 1 |
| `tryMove(dr, dc)` | Procesa un turno de movimiento |
| `exportBoard()` | Descarga el nivel activo como JSON |
| `importBoard(evt)` | Carga un nivel desde un archivo JSON |

**Estado interno (no exportado):**

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `G` | Object | Estado completo de la partida en curso |
| `levels` | Array | Niveles cargados en la sesión actual |
| `currentIndex` | Number | Índice del nivel activo |

**Secciones internas:**

| Sección | Funciones |
|---------|-----------|
| Shop | `itemLabel()`, `buyItem()` |
| Event dispatch | `handleEvent()` — recibe resultados de `events.js` y aplica efectos secundarios |
| Lifecycle | `winGame()`, `advanceLevel()`, `gameOver()` |
| Input (click) | `onCellClick()` — pasada como callback a `buildBoard()` |

> `handleEvent` es el puente entre los handlers puros de `events.js` y los
> efectos del juego: logging, modales, game over, avance de nivel.

### `state.js`

```js
initState(boardData)  // → G
```

Crea el estado inicial de la partida a partir de los datos de un nivel.
Sin efectos secundarios.

```js
G = {
  board:    boardData,             // referencia al nivel activo
  player:   { hp, maxHp, atk, def, gold },
  pos:      [row, col],
  turns:    Number,
  events:   { "r,c": { type, data } },  // copia mutable del nivel
  visited:  Set,                   // celdas donde el jugador estuvo
  revealed: Set,                   // celdas dentro del radio de visión
  over:     Boolean,
  won:      Boolean,
}
```

### `fog.js`

```js
revealAround(state, r, c, radius = 2)
```

Marca `r,c` como visitada y agrega al set `revealed` todas las celdas
dentro del radio (cuadrado de lado `2*radius+1`). El radio es configurable
para facilitar experimentación.

### `combat.js`

```js
roll(min, max)                  // entero aleatorio [min, max]
resolveCombat(state, enemy)     // → { won: bool, lines: [{cls, txt}] }
```

Combate por turnos: el jugador ataca primero. No llama a `log()` ni modifica
el DOM — devuelve las líneas de texto para que el llamador decida cómo mostrarlas.

### `events.js`

```js
EVENT_HANDLERS   // { enemy, treasure, potion, trap, npc }
```

Cada handler es una **transformación pura de estado**: modifica `state` y
devuelve un objeto de resultado. No llama a `log()`, `showModal()` ni `gameOver()`.

| Handler | Retorna |
|---------|---------|
| `enemy` | `{ lines, died }` |
| `treasure` | `{ msg, cls }` |
| `potion` | `{ msg, cls }` |
| `trap` | `{ msg, cls, died }` |
| `npc` | `{ shop }` |

`game.js` recibe esos resultados en `handleEvent()` y aplica los efectos secundarios.
Este diseño evita dependencias circulares entre `events.js` y `game.js`.

### `renderer.js`

```js
buildBoard(boardData, container, onCellClick)
render(state, container)
getEventAssetId(ev)   // → string | null
```

`buildBoard` construye la grilla de `<div class="cell">` y registra el callback
de click recibido como parámetro (sin acoplarse a `tryMove` directamente).

`render` itera todas las celdas y actualiza `className` e `innerHTML` según el
estado de visibilidad (fog / dim / visible) y la presencia del jugador o eventos.

### `hud.js`

```js
updateHUD(state)
```

Sincroniza los elementos del DOM del HUD con `state.player` y `state.turns`.

---

## Archivos estáticos

### `css/style.css`
Puntos clave:
- `.cell` — celda base (52×52 px, posición relativa para apilar capas)
- `.cell.fog` — celda no descubierta (oculta todo el contenido)
- `.cell.dim` — celda visible pero no visitada (entidad al 50% + overlay oscuro)
- `.cell-bg` / `.cell-entity` — capas absolutas para separar fondo de entidad

### `assets/*.svg`
Sprites SVG de 64×64 px. Se referencian como `<img src="assets/NOMBRE.svg">`.
Para reemplazar un sprite basta sustituir el archivo.

| Archivo | Uso |
|---------|-----|
| `player.svg` | Jugador |
| `floor.svg` | Tile de suelo |
| `wall.svg` | Tile de pared |
| `exit.svg` | Tile de salida de nivel |
| `rat.svg` | Enemigo débil |
| `skeleton.svg` | Enemigo medio |
| `goblin.svg` | Enemigo medio-bajo |
| `troll.svg` | Enemigo fuerte |
| `dragon.svg` | Jefe final (nivel 3) |
| `npc.svg` | Mercader/NPC |
| `treasure.svg` | Cofre de oro |
| `potion.svg` | Poción de vida |
| `trap.svg` | Trampa |

---

## Flujo de datos

```
main.js
  │
  ├─ import() dinámico de level1..N.js  (en paralelo)
  │
  └─ restartGame(levels)
       ├─ initState(levels[0])   →  G
       ├─ revealAround(G, ...)   →  G.visited, G.revealed
       ├─ buildBoard(G.board, container, onCellClick)  →  DOM
       ├─ render(G, container)   →  actualiza innerHTML
       └─ updateHUD(G)
```

### Ciclo por turno

```
input (tecla / click)
  └─ tryMove(dr, dc)                          [game.js]
       ├─ validar límites y passable
       ├─ G.pos, G.turns
       ├─ revealAround(G, nr, nc)             [fog.js]
       ├─ handleEvent(G, key, event)          [game.js]
       │    └─ EVENT_HANDLERS[type](G, key, data)  [events.js]
       │         └─ retorna { lines?, msg?, died?, shop? }
       │    ├─ log(lines / msg)
       │    ├─ died → gameOver()
       │    └─ shop → showModal() con buyItem()
       ├─ render(G, container)                [renderer.js]
       └─ updateHUD(G)                        [hud.js]
```

### Sistema de niebla de guerra

| Estado | Condición | Visual |
|--------|-----------|--------|
| `fog` | No está en `revealed` | Negra, contenido oculto |
| `dim` | En `revealed`, no en `visited` | Visible al 50%, overlay oscuro |
| visible | En `visited` | Completamente visible |

`visited` contiene las posiciones donde el jugador ha estado.
`revealed` contiene todas las celdas dentro del radio de cada posición visitada.

---

## Agregar un nivel nuevo

1. Crear `level/levelN.js`:
```js
export default {
  meta: { name, rows, cols, startPos, player: { hp, maxHp, atk, def, gold } },
  tileset: { ... },
  map: [ [...], ... ],
  events: { "r,c": { type, data }, ... }
};
```
2. Agregar `'levelN'` al array en `level/manifest.js`

No se requieren cambios en ningún otro archivo.

## Agregar un tipo de evento nuevo

1. Agregar el handler en `EVENT_HANDLERS` en `js/events.js` (retornar datos, sin efectos secundarios)
2. Agregar el caso en `handleEvent()` en `js/game.js` si el resultado necesita manejo especial
3. Agregar el caso en `getEventAssetId()` en `js/renderer.js` si tiene representación visual
4. Agregar el SVG en `assets/`
5. Usar el tipo en los archivos de nivel
