import { CLASSES } from '../classes.js';

export function initState(boardData, classId = 'warrior') {
  const classDef = CLASSES[classId];
  return {
    board:    boardData,
    player:   { ...classDef.stats, class: classId },
    pos:      [...boardData.meta.startPos],
    turns:    0,
    events:   structuredClone(boardData.events),
    visited:  new Set(),
    revealed: new Set(),
    visible:  new Set(),
    dim:      new Map(),
    searched: new Set(),
    stepsRemaining: 0,
    phase:    'player',
    over:     false,
    won:      false,
  };
}
