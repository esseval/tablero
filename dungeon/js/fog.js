export function revealAround(state, r, c, radius = 2) {
  state.visited.add(`${r},${c}`);
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      state.revealed.add(`${r + dr},${c + dc}`);
    }
  }
}
