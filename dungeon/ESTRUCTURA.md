# Estructura del proyecto — Dungeon Explorer

Juego de exploración de mazmorras por turnos que corre íntegramente en el browser,
sin dependencias externas ni servidor. Puede abrirse directamente como `file://`.

---

## Árbol de archivos

```
tablero/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── loader.js
│   └── game.js
├── assets/
│   ├── player.svg
│   ├── floor.svg
│   ├── wall.svg
│   ├── exit.svg
│   ├── rat.svg
│   ├── skeleton.svg
│   ├── troll.svg
│   ├── goblin.svg
│   ├── dragon.svg
│   ├── npc.svg
│   ├── treasure.svg
│   ├── potion.svg
│   └── trap.svg
└── level/
    ├── manifest.js
    ├── level1.js
    ├── level2.js
    └── level3.js
```

---

## Archivos

### `index.html`
Contiene únicamente el markup HTML: la barra de herramientas (exportar/importar),
el layout con el HUD y el tablero, el panel de log y el modal. No tiene lógica
ni estilos inline. El único `<script>` que carga es `js/loader.js`.

### `css/style.css`
Todos los estilos del juego. Puntos clave:
- `.cell` — celda base del tablero (52×52 px, posición relativa para apilar capas)
- `.cell.fog` — celda no descubierta (oculta todo el contenido)
- `.cell.dim` — celda visible pero no visitada (entidad al 50% de opacidad + overlay oscuro)
- `.cell-bg` / `.cell-entity` — capas absolutas dentro de cada celda para separar fondo de entidad

### `js/loader.js`
Punto de entrada. Carga `game.js`, luego `level/manifest.js` y finalmente cada
archivo de nivel declarado en el manifest. No requiere modificar `index.html`
al agregar nuevos niveles.

**Flujo de carga:**
```
loader.js
  └─ game.js  (onload)
       └─ level/manifest.js  (onload → LEVEL_MANIFEST disponible)
            └─ level1.js  (onload)
                 └─ level2.js  (onload)
                      └─ level3.js  (onload)
                           └─ restartGame()
```

Los niveles se cargan en el orden declarado en `LEVEL_MANIFEST`.
Al terminar el último se llama a `restartGame()`.

### `js/game.js`
Toda la lógica del juego. Organizado en secciones:

| Sección | Responsabilidad |
|---------|----------------|
| **Globals** | `FOG_RADIUS`, `LEVELS`, `currentLevelIndex`, `BOARD_DATA`, `G` |
| **Game State** | `initState()` — crea el estado inicial a partir de un nivel |
| **Fog of War** | `revealAround()` — expande el área visible alrededor del jugador |
| **Combat** | `roll()`, `resolveCombat()` — combate por turnos con aleatoriedad |
| **Move Logic** | `tryMove()` — valida movimiento, actualiza posición y dispara eventos |
| **Event Handlers** | `EVENT_HANDLERS`, `handleEvent()` — tabla de despacho por tipo de evento |
| **Renderer** | `buildBoard()`, `render()`, `cellEl()`, `getEventAssetId()` |
| **HUD** | `updateHUD()` — sincroniza stats con el DOM |
| **Log** | `log()` — agrega líneas al panel de mensajes |
| **Input** | keydown + `onCellClick()` |
| **Modal** | `showModal()`, `closeModal()` |
| **Shop** | `itemLabel()`, `buyItem()` — lógica de compra al NPC |
| **Import/Export** | `exportBoard()`, `importBoard()`, `readJSON()`, `download()` |
| **Init** | `buildLevels()`, `restartGame()`, `advanceLevel()` |

### `assets/*.svg`
Cada sprite es un archivo SVG independiente de 64×64 px referenciado
directamente como `<img src="assets/NOMBRE.svg">`. No se usa encoding base64.
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
| `potion.svg` | Poción de vida (pickup) |
| `trap.svg` | Trampa oculta |

### `level/manifest.js`
Declara el array `LEVEL_MANIFEST` con los nombres de archivo de los niveles
en orden de juego. `loader.js` lo lee para saber exactamente qué cargar,
evitando requests 404 por prueba y error.

```js
var LEVEL_MANIFEST = ['level1', 'level2', 'level3'];
```

### `level/level*.js`
Cada nivel declara una variable global con `var` (necesario para que sea
accesible como propiedad de `window`, que es como `buildLevels()` los descubre).

```js
var LEVEL1 = {
  meta: {
    name: "Nombre del nivel",
    rows: 12, cols: 12,
    startPos: [1, 1],
    player: { hp: 20, maxHp: 20, atk: 5, def: 3, gold: 0 }
  },
  tileset: {
    floor: { passable: true,  asset: "floor" },
    wall:  { passable: false, asset: "wall"  },
    exit:  { passable: true,  asset: "exit"  }
  },
  map: [
    ["wall", "floor", ...],  // array de strings por fila
    ...
  ],
  events: {
    "fila,col": { type: "enemy",    data: { id, name, hp, maxHp, atk, def, gold, xp } },
    "fila,col": { type: "treasure", data: { gold, msg } },
    "fila,col": { type: "potion",   data: { hp, msg } },
    "fila,col": { type: "trap",     data: { dmg, msg } },
    "fila,col": { type: "npc",      data: { name, msg, items: [...] } },
  }
};
```

> **Nota:** `const` y `let` en scripts no-module no crean propiedades en `window`,
> por lo que `buildLevels()` no los encontraría. Los archivos de nivel usan `var`
> por esta razón específica.

---

## Flujo de datos

```
loader.js
  │
  ├─ carga game.js (define funciones y EVENT_HANDLERS)
  │
  ├─ carga level/manifest.js (define LEVEL_MANIFEST en window)
  │
  └─ carga level1..N.js según LEVEL_MANIFEST (definen LEVEL1..N en window)
       │
       └─ restartGame()
            ├─ buildLevels()  →  LEVELS = [LEVEL1, LEVEL2, ...]
            ├─ initState()    →  G = { board, player, pos, events, visited, revealed, ... }
            ├─ revealAround() →  G.visited, G.revealed
            ├─ buildBoard()   →  crea los <div class="cell"> en el DOM
            └─ render()       →  actualiza innerHTML de cada celda
```

### Ciclo por turno

```
input (tecla / click)
  └─ tryMove(dr, dc)
       ├─ valida límites y passable
       ├─ actualiza pos, turns
       ├─ revealAround()
       ├─ handleEvent()  →  EVENT_HANDLERS[type](state, key, data)
       │    ├─ enemy    →  resolveCombat() → gameOver() | continuar
       │    ├─ treasure →  suma gold
       │    ├─ potion   →  suma hp
       │    ├─ trap     →  resta hp → gameOver()
       │    └─ npc      →  showModal() con items[]
       ├─ render()
       └─ updateHUD()
```

### Sistema de niebla de guerra

Cada celda puede estar en uno de tres estados:

| Estado | Condición | Visual |
|--------|-----------|--------|
| `fog` | No está en `revealed` | Negra, contenido oculto |
| `dim` | En `revealed`, no en `visited` | Visible al 50%, overlay oscuro |
| visible | En `visited` | Completamente visible |

`visited` contiene solo las posiciones donde el jugador ha estado.
`revealed` contiene todas las celdas dentro del radio `FOG_RADIUS` de cada posición visitada.
Las entidades (enemigos, ítems) se muestran si la celda está en `revealed`.

---

## Agregar un nivel nuevo

1. Crear `level/levelN.js` con `var LEVELN = { ... }`
2. Agregar `'levelN'` al array en `level/manifest.js`

No se requieren cambios en `game.js` ni en `index.html`.

## Agregar un tipo de evento nuevo

1. Agregar el handler en `EVENT_HANDLERS` en `game.js`
2. Agregar el caso en `getEventAssetId()` si tiene representación visual
3. Agregar el SVG en `assets/`
4. Usar el tipo en los archivos de nivel
