export function initState(boardData) {
  const m = boardData.meta;
  console.log(m);
  return {
    board:    boardData,
    player:   { ...m.player },
    pos:      [...m.startPos],
    turns:    0,
    events:   structuredClone(boardData.events),
    // visited: celdas donde el jugador ya pisó (usado para entrada/salida de niveles)
    visited:  new Set(),
    // revealed: celdas descubiertas alguna vez (persiste entre turnos — útil para minimapa)
    revealed: new Set(),
    // visible: celdas visibles en el turno actual (se recalcula desde cero en cada movimiento)
    visible:  new Set(),
    // dim: key -> distancia Chebyshev (0, 1, 2) para dimming gradual
    dim:      new Map(),
    // searched: celdas con trap/potion reveladas por la acción Buscar
    searched: new Set(),
    stepsRemaining: 0,
    over:     false,
    won:      false,
  };
}
