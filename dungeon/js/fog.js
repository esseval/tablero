// Revela las celdas visibles desde (r, c) en un radio dado.
// Puebla state.visible (solo este turno) y state.revealed (acumulativo).
// La línea de visión se corta al encontrar una pared, ocultando lo que está detrás.
export function revealAround(state, r, c, radius = 2) {
  state.visited.add(`${r},${c}`);

  // Limpia la visibilidad del turno anterior; se recalcula desde cero
  state.visible = new Set();

  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      const tr = r + dr, tc = c + dc;

      // Saltea celdas fuera del mapa
      if (tr < 0 || tr >= state.board.map.length || tc < 0 || tc >= state.board.map[0].length) continue;

      // La celda del jugador siempre se ve; las demas necesitan linea de vision
      if (dr === 0 && dc === 0 || hasLineOfSight(state, r, c, tr, tc)) {
        // revealed: queda para siempre (minimapa, estadisticas)
        state.revealed.add(`${tr},${tc}`);
        // visible: solo para este turno — se borra arriba en cada llamado
        state.visible.add(`${tr},${tc}`);
      }
    }
  }
}

// Verifica si hay una linea recta sin paredes entre (r0, c0) y (r1, c1).
// Camina en N pasos iguales (N = distancia Chebyshev), revisando cada celda intermedia.
function hasLineOfSight(state, r0, c0, r1, c1) {
  const dr = r1 - r0;
  const dc = c1 - c0;

  // Cantidad de pasos necesarios: la mayor diferencia entre ejes
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  const stepR = dr / steps;
  const stepC = dc / steps;
  let cr = r0, cc = c0;

  // Arranca en 1 para no evaluar la celda de origen
  // Termina en steps-1 para no evaluar la celda destino
  for (let i = 1; i < steps; i++) {
    cr += stepR;
    cc += stepC;
    const rr = Math.round(cr);
    const rc = Math.round(cc);

    // Fuera del mapa -> no hay vision
    const tileId = state.board.map[rr]?.[rc];
    if (tileId === undefined) return false;

    // Pared intermedia -> bloquea la vision
    if (!state.board.tileset[tileId].passable) return false;
  }

  return true;
}
