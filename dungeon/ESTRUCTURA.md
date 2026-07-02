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
    ├── player.js                ← stats base del jugador (PLAYER_BASE)
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── main.js              ← entry point
    │   ├── game.js               ← orquestador
    │   ├── state.js
    │   ├── fog.js
    │   ├── combat.js
    │   ├── events.js
    │   ├── renderer.js
    │   └── hud.js
    ├── assets/
    │   └── *.png (+ *.svg fuente, cuando existe)
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

## `dungeon/player.js`

```js
export const PLAYER_BASE = {
  hp, maxHp, atk, def, gold,
  moveDice, atkDice, defDice,   // cantidad de dados D6 por tirada
  xp, level, visionRange,
}
```

Stats iniciales del jugador. Cada nivel los referencia con
`player: { ...PLAYER_BASE }` en su `meta`, en vez de repetir los valores.

---

## Módulos de Dungeon (`dungeon/js/`)

### `main.js` — Entry point

Punto de entrada declarado como `<script type="module">` en `index.html`.
Responsabilidades:
- Registrar el listener de teclado (WASD / flechas) sobre `#board`
- Cablear los botones de la barra IO: exportar/importar tablero, nueva
  partida, **Buscar** (`trySearch`) y **Terminar turno** (`rollDice`)
- Cargar los niveles con `import()` dinámico a partir del manifest
- Llamar a `restartGame(levels)` para iniciar el juego

**Flujo de carga:**
```
<script type="module" src="js/main.js">
  │
  ├─ import estático: game.js, level/manifest.js
  │
  └─ await Promise.all(
       MANIFEST.map(name => import(`../level/${name}.js`).then(m => m.default))
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
| `rollDice()` | Tira los dados de movimiento y carga `G.stepsRemaining` (un "turno") |
| `tryMove(dr, dc)` | Da un paso, consumiendo `stepsRemaining` |
| `trySearch()` | Revela pociones/trampas ocultas dentro de `G.visible` |
| `exportBoard()` | Descarga el nivel activo como JSON |
| `importBoard(evt)` | Carga un nivel desde un archivo JSON |

**Estado interno (no exportado):**

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `G` | Object | Estado completo de la partida en curso |
| `levels` | Array | Niveles cargados en la sesión actual |
| `currentIndex` | Number | Índice del nivel activo |
| `returnPos` | [r,c] \| null | Posición a restaurar al volver de un nivel por la entrada |
| `levelCache` | Object | Eventos de niveles ya visitados, para no perder su estado al ir y volver |
| `shopOpen` | Boolean | Bloquea movimiento/ataque mientras el modal del NPC está abierto |

**Secciones internas:**

| Sección | Funciones |
|---------|-----------|
| Shop | `itemLabel()`, `buyItem()` |
| Dice | `rollDice()` — tira `player.moveDice` D6 y fija `stepsRemaining` |
| Event dispatch | `handleEvent()` — recibe resultados de `events.js` y aplica efectos secundarios |
| Move | `tryMove()` — un paso; dispara `handleEvent` si la celda destino tiene evento |
| Open | `tryOpen()` — abre un cofre (`treasure`) adyacente |
| Attack | `tryAttack()` — resuelve un asalto de combate contra un enemigo adyacente |
| Search | `trySearch()` — revela pociones/trampas en celdas visibles no exploradas |
| Lifecycle | `winGame()`, `advanceLevel()`, `goBackLevel()`, `gameOver()` |
| Input (click) | `onCellClick()` — decide entre `tryAttack` / `tryOpen` / `tryMove` según el evento de la celda clickeada |

> `handleEvent` es el puente entre los handlers puros de `events.js` y los
> efectos del juego: logging, modales, game over, avance de nivel. Como los
> enemigos y cofres bloquean el paso en `tryMove` (ver más abajo), en la
> práctica solo dispara para `trap`, `potion` y `npc` — el combate y la
> apertura de cofres se resuelven por acción explícita (`tryAttack`/`tryOpen`),
> no al caminar sobre la celda.

### `state.js`

```js
initState(boardData)  // → G
```

Crea el estado inicial de la partida a partir de los datos de un nivel.
Sin efectos secundarios.

```js
G = {
  board:    boardData,             // referencia al nivel activo
  player:   { hp, maxHp, atk, def, gold, moveDice, atkDice, defDice, xp, level, visionRange },
  pos:      [row, col],
  turns:    Number,
  events:   { "r,c": { type, data } },  // copia mutable del nivel
  visited:  Set,                   // celdas donde el jugador ya pisó
  revealed: Set,                   // celdas descubiertas alguna vez (persiste — usado por el minimapa)
  visible:  Set,                   // celdas dentro del cono de visión del turno actual (se recalcula en cada paso)
  dim:      Map,                   // key -> distancia Chebyshev, para atenuar gradualmente lo visible
  searched: Set,                   // celdas con potion/trap ya reveladas por la acción Buscar
  stepsRemaining: Number,          // pasos que quedan en el turno actual (cargados por rollDice)
  over:     Boolean,
  won:      Boolean,
}
```

### `fog.js`

```js
revealAround(state, r, c, radius)
```

Recalcula la visión desde `(r, c)`: limpia `visible`/`dim` del turno anterior
y los repuebla desde cero recorriendo el cuadrado de lado `2*radius+1`
alrededor del jugador. Una celda entra en `visible` solo si hay línea de
vista sin paredes de por medio (`hasLineOfSight`, función interna); `dim`
guarda la distancia Chebyshev de cada celda visible, usada para atenuar
gradualmente las que están más lejos. `revealed` es acumulativo: una vez
vista, una celda queda marcada para siempre (lo usa el minimapa). `visited`
también es acumulativo y registra dónde estuvo parado el jugador.

### `combat.js`

```js
roll(min, max)                      // entero aleatorio [min, max]
xpThreshold(level)                  // → xp necesaria para subir del nivel dado
checkLevelUp(player)                // sube de nivel mientras player.xp alcance el umbral; → bool
resolveAttackRound(state, enemy)    // → { died, playerDied?, lines, xpGained?, leveledUp?, newLevel? }
```

Un asalto de combate: el jugador ataca con `atk + tirada(atkDice)` contra la
`def` del enemigo; si el enemigo sobrevive, contraataca con `atk + roll(0,3)`
contra `def + tirada(defDice)` del jugador. Al derrotar al enemigo se suma
oro y xp, y se llama a `checkLevelUp`. No llama a `log()` ni modifica el DOM —
devuelve las líneas de texto para que el llamador (`tryAttack` en `game.js`)
decida cómo mostrarlas.

### `events.js`

```js
EVENT_HANDLERS   // { enemy, treasure, potion, trap, npc }
```

Cada handler es una **transformación pura de estado**: modifica `state` y
devuelve un objeto de resultado. No llama a `log()`, `showModal()` ni `gameOver()`.

| Handler | Retorna | Notas |
|---------|---------|-------|
| `enemy` | `{ lines, died, leveledUp?, newLevel? }` | Respaldo: el combate normal se dispara desde `tryAttack()` en `game.js`, no al pisar la celda |
| `treasure` | `{ msg, cls, xpGained?, leveledUp?, newLevel? }` | Se invoca desde `tryOpen()`, no automáticamente al moverse |
| `potion` | `{ msg, cls }` | |
| `trap` | `{ msg, cls, died }` | |
| `npc` | `{ shop }` | Filtra ítems con `stock === 0` antes de devolver la lista |

`game.js` recibe esos resultados en `handleEvent()` (o directamente en
`tryAttack()`/`tryOpen()`) y aplica los efectos secundarios. Este diseño evita
dependencias circulares entre `events.js` y `game.js`.

### `renderer.js`

```js
buildBoard(boardData, container, onCellClick, getState)
render(state, container)
getEventAssetId(ev)   // → string | null
```

`buildBoard` construye la grilla de `<div class="cell">` y registra el
callback de click recibido como parámetro (sin acoplarse a `tryMove`
directamente). También registra un listener `mouseenter` por celda que, vía
`getState()`, consulta el estado más reciente y setea `cell.title` con el
nombre/stats del enemigo o NPC si la celda está en `state.visible`.

`render` itera todas las celdas y actualiza `className` e `innerHTML` según
`state.visible` (fog total si no está) y `state.dim` (atenuación gradual por
distancia). Las celdas con `potion`/`trap` no se pintan hasta que están en
`state.searched`. Los assets se referencian como `assets/<id>.png`. Al final
de `render`, llama a la función interna `renderMinimap(state)`, que dibuja un
píxel por celda en el `<canvas id="minimap">` (negro = no revelada, según
`state.revealed`).

### `hud.js`

```js
updateHUD(state)
```

Sincroniza los elementos del DOM del HUD con `state.player` (vida, ataque,
defensa, oro, dados, nivel/XP vía `xpThreshold` de `combat.js`) y con
`state.turns` / `state.stepsRemaining`.

---

## Archivos estáticos

### `css/style.css`
Puntos clave:
- `.cell` — celda base (52×52 px, posición relativa para apilar capas)
- `.cell.fog` — celda fuera de `state.visible` (oculta todo el contenido)
- `.cell.dim` — celda visible pero lejana (opacidad y overlay controlados por `--entity-opacity`/`--overlay-opacity`, seteados en JS según la distancia)
- `.cell-bg` / `.cell-entity` — capas absolutas para separar fondo de entidad
- `#minimap` — tamaño e `image-rendering: pixelated` del canvas del minimapa

### `assets/*.png`
Sprites de 64×64 px, referenciados como `<img src="assets/NOMBRE.png">`.
Varios cuentan además con un `.svg` fuente del mismo nombre. Para reemplazar
un sprite alcanza con sustituir el `.png` (y el `.svg` si se mantiene como
fuente editable).

| Archivo | Uso |
|---------|-----|
| `player` | Jugador |
| `floor` | Tile de suelo |
| `wall` | Tile de pared |
| `exit` | Tile de salida de nivel |
| `entrance` | Tile de entrada (vuelve al nivel anterior) |
| `spider` | Enemigo débil |
| `skeleton` | Enemigo medio |
| `goblin` | Enemigo medio-bajo |
| `troll` | Enemigo fuerte |
| `dragon` | Jefe final (nivel 3) |
| `npc` | Mercader/NPC |
| `treasure` | Cofre de oro |
| `potion` | Poción de vida |
| `trap` | Trampa |

---

## Flujo de datos

```
main.js
  │
  ├─ import() dinámico de level1..N.js  (en paralelo)
  │
  └─ restartGame(levels)
       ├─ initState(levels[0])   →  G
       ├─ revealAround(G, ...)   →  G.visited, G.revealed, G.visible, G.dim
       ├─ buildBoard(G.board, container, onCellClick, () => G)  →  DOM
       ├─ render(G, container)   →  actualiza innerHTML + minimapa
       ├─ updateHUD(G)
       └─ rollDice()             →  G.stepsRemaining para el primer turno
```

### Ciclo por turno

```
rollDice()                                    [game.js]
  └─ tira player.moveDice D6 → G.stepsRemaining, G.turns++

input (tecla / click en celda adyacente vacía)
  └─ tryMove(dr, dc)                          [game.js]
       ├─ validar límites, passable y que la celda no tenga enemy/treasure
       ├─ G.pos, G.stepsRemaining--
       ├─ revealAround(G, nr, nc, player.visionRange)   [fog.js]
       ├─ si hay evento en la celda (trap/potion/npc) → handleEvent(G, key, event)  [game.js]
       │    └─ EVENT_HANDLERS[type](G, key, data)       [events.js]
       │         └─ retorna { msg?, cls?, died?, shop?, xpGained?, leveledUp? }
       │    ├─ log(msg) / log(xpGained) / log(leveledUp)
       │    ├─ died → gameOver()
       │    └─ shop → showModal() con buyItem()
       ├─ render(G, container)                [renderer.js]
       ├─ updateHUD(G)                        [hud.js]
       └─ si stepsRemaining llega a 0 → rollDice() automáticamente

input (click en celda adyacente con enemigo)
  └─ tryAttack(dr, dc)                        [game.js]
       └─ resolveAttackRound(G, enemy)        [combat.js] → log, XP, gameOver si murió

input (click en celda adyacente con cofre)
  └─ tryOpen(dr, dc)                          [game.js]
       └─ EVENT_HANDLERS.treasure(G, key, data)  [events.js] → log, XP

botón "Buscar"
  └─ trySearch()                              [game.js]
       └─ revela potion/trap dentro de G.visible aún no exploradas → G.searched
```

### Sistema de visión (línea de vista)

| Estado | Condición | Visual |
|--------|-----------|--------|
| `fog` | No está en `visible` | Negra, contenido oculto |
| `dim` | En `visible`, a distancia > 0 del jugador | Opacidad/overlay graduados según distancia (Chebyshev) |
| visible pleno | Celda del jugador (distancia 0) | Completamente visible |

`visible` y `dim` se recalculan **desde cero en cada paso** (`revealAround`),
recorriendo el radio `player.visionRange` y cortando la línea de vista al
toparse con una pared (`hasLineOfSight`). `revealed` es la unión histórica de
todo lo que estuvo alguna vez en `visible` — no se usa para el fog del
tablero, solo para el minimapa. `visited` registra las celdas donde el
jugador efectivamente estuvo parado (usado para la lógica de entrada/salida
de nivel).

---

## Agregar un nivel nuevo

1. Crear `level/levelN.js`:
```js
import { PLAYER_BASE } from '../player.js';

export default {
  meta: { name, rows, cols, startPos, player: { ...PLAYER_BASE } },
  tileset: { ... },
  map: [ [...], ... ],
  events: { "r,c": { type, data }, ... }
};
```
2. Agregar `'levelN'` al array en `level/manifest.js`

No se requieren cambios en ningún otro archivo.

## Agregar un tipo de evento nuevo

1. Agregar el handler en `EVENT_HANDLERS` en `js/events.js` (retornar datos, sin efectos secundarios)
2. Si el tipo debe dispararse automáticamente al pisar la celda, agregar el caso en `handleEvent()` en `js/game.js`; si requiere una acción explícita (como `enemy`/`treasure`), agregar una función `tryX()` propia y su rama en `onCellClick()`
3. Agregar el caso en `getEventAssetId()` en `js/renderer.js` si tiene representación visual
4. Agregar el sprite en `assets/`
5. Usar el tipo en los archivos de nivel
