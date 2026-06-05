# CLAUDE.md — Tablero de Juegos

## Descripción del proyecto

Colección de juegos de tablero que corren en el browser, sin dependencias externas.
Servido en `localhost:92/tablero/`. Requiere HTTP — no funciona como `file://`
porque los módulos ES6 tienen restricciones CORS.

## Estructura

```
tablero/
├── index.html          ← hub de navegación entre juegos
├── shared/             ← módulos ES6 compartidos entre todos los juegos
│   ├── modal.js        → showModal(), closeModal()
│   ├── log.js          → createLog(elementId)
│   └── storage.js      → download(), readJSON()
└── dungeon/            ← sub-proyecto: Dungeon Explorer
    ├── index.html
    ├── css/style.css
    ├── assets/*.svg
    ├── js/
    │   ├── main.js     ← entry point (<script type="module">)
    │   ├── game.js     ← orquestador (tryMove, lifecycle, I/O)
    │   ├── state.js    → initState()
    │   ├── fog.js      → revealAround()
    │   ├── combat.js   → roll(), resolveCombat()
    │   ├── events.js   → EVENT_HANDLERS (transformaciones puras)
    │   ├── renderer.js → buildBoard(), render()
    │   └── hud.js      → updateHUD()
    └── level/
        ├── manifest.js → export const MANIFEST = [...]
        ├── level1.js   → export default { meta, tileset, map, events }
        ├── level2.js
        └── level3.js
```

Sub-proyectos pendientes: `senet/`, `zombies/`.

## Convenciones de código

- **ES6 modules** en todo el proyecto: `import`/`export`, sin `var` global, sin scripts concatenados.
- **Sin frameworks ni build tools**: vanilla JS, CSS plano, SVG inline o como `<img>`.
- **Sin comentarios descriptivos**: el código se explica con nombres. Comentar solo restricciones no obvias.
- Los módulos de `shared/` no deben contener referencias a ningún juego específico.
- Los `EVENT_HANDLERS` en `events.js` son transformaciones puras: modifican estado y retornan datos, sin llamar `log()`, `showModal()` ni funciones de ciclo de vida. Los efectos secundarios van en `game.js`.

## Agregar un sub-proyecto nuevo

1. Crear `tablero/nombre/` con su propia `index.html` y `js/main.js`
2. Importar desde `../../shared/` lo que se reutilice
3. Agregar la card en `tablero/index.html` (quitar clase `disabled`)

## Agregar un nivel a Dungeon

1. Crear `dungeon/level/levelN.js` con `export default { meta, tileset, map, events }`
2. Agregar `'levelN'` al array en `dungeon/level/manifest.js`

## Git

- Rama principal: `main`
- Un commit por cambio lógico — no agrupar refactors con features ni docs con código
- Formato de mensaje: `tipo(scope): descripción` — tipos: `feat`, `fix`, `refactor`, `chore`, `docs`
- No instalar paquetes (pip, npm, apt) sin confirmación previa

## Documentación interna de Dungeon

- `dungeon/ESTRUCTURA.md` — arquitectura, módulos, flujo de datos
- `dungeon/EJERCICIOS.md` — ejercicios de extensión ordenados por complejidad
