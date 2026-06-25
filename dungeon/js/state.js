export function initState(boardData) {
  const m = boardData.meta;
  return {
    board:    boardData,
    player:   { ...m.player },
    pos:      [...m.startPos],
    turns:    0,
    events:   { ...boardData.events },
    // visited: celdas donde el jugador ya pisó (usado para entrada/salida de niveles)
    visited:  new Set(),
    // revealed: celdas descubiertas alguna vez (persiste entre turnos — útil para minimapa)
    revealed: new Set(),
    // visible: celdas visibles en el turno actual (se recalcula desde cero en cada movimiento)
    visible:  new Set(),
    stepsRemaining: 0,
    over:     false,
    won:      false,
  };
}
