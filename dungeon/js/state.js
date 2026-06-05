export function initState(boardData) {
  const m = boardData.meta;
  return {
    board:    boardData,
    player:   { ...m.player },
    pos:      [...m.startPos],
    turns:    0,
    events:   { ...boardData.events },
    visited:  new Set(),
    revealed: new Set(),
    over:     false,
    won:      false,
  };
}
