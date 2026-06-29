# Informe de estructura — Dungeon Explorer

```
dungeon/
├── index.html                  ← Entry point del juego
│
├── css/
│   └── style.css               ← Estilos: celdas, niebla, HUD, modal, minimapa
│
├── assets/                     ← Sprites SVG (64×64 px)
│   ├── dragon.svg
│   ├── exit.svg
│   ├── floor.svg
│   ├── goblin.svg
│   ├── npc.svg
│   ├── player.svg
│   ├── potion.svg
│   ├── rat.svg
│   ├── skeleton.svg
│   ├── trap.svg
│   ├── treasure.svg
│   ├── troll.svg
│   └── wall.svg
│
├── js/                         ← Módulos ES6 del juego
│   ├── main.js                 ← Entry point: listeners, carga de niveles
│   ├── game.js                 ← Orquestador: tryMove, ciclo de vida, I/O, shop
│   ├── state.js                ← initState(): crea el estado de partida
│   ├── fog.js                  ← revealAround(): niebla con línea de visión
│   ├── combat.js               ← roll(), resolveCombat(): combate con dados
│   ├── events.js               ← EVENT_HANDLERS: transformaciones puras
│   ├── renderer.js             ← buildBoard(), render(), renderMinimap()
│   ├── hud.js                  ← updateHUD(): sincroniza estadísticas + dados
│   └── player.js               ← PLAYER_BASE: stats base del jugador
│
├── level/                      ← Definiciones de niveles
│   ├── manifest.js             ← Array con nombres de niveles
│   ├── level1.js
│   ├── level2.js
│   └── level3.js
│
├── ESTRUCTURA.md               ← Documentación detallada de arquitectura
├── EJERCICIOS.md               ← Ejercicios de extensión
└── INFORME.md                  ← Este archivo
```

## Dependencias entre módulos

```
main.js
  ├── game.js
  ├── level/manifest.js
  └── import() dinámico → level/*.js

game.js
  ├── state.js
  ├── fog.js
  ├── combat.js
  ├── events.js
  ├── renderer.js
  └── hud.js

renderer.js
  └── hud.js (renderMinimap usa stat-dice-val)
```

## Resumen por capa

| Capa | Archivos | Responsabilidad |
|------|----------|----------------|
| Entry point | `main.js` | Carga asíncrona de niveles, registro de eventos de teclado/UI |
| Orquestación | `game.js` | Ciclo de turno, eventos secundarios, cambio de nivel, fin de partida, shop |
| Estado | `state.js` | `initState()` — construye el objeto `G` con visited, revealed y visible |
| Datos de jugador | `player.js` | `PLAYER_BASE` — stats iniciales y configuración de dados |
| Lógica pura | `fog.js`, `combat.js`, `events.js` | Transformaciones de estado sin efectos secundarios ni I/O |
| Presentación | `renderer.js`, `hud.js` | Sincronizan DOM con el estado (board, minimapa, HUD) |
| Datos | `level/*.js` | Mapas, tilesets y eventos de cada nivel |
| Estilo | `css/style.css` | Grid, niebla, HUD, modal, minimapa |
| Sprites | `assets/*.svg` | Representación visual de tiles y entidades |
