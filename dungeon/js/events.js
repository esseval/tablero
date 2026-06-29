import { resolveCombat, checkLevelUp } from './combat.js';

export const EVENT_HANDLERS = {
  enemy(state, key, data) {
    const result = resolveCombat(state, { ...data });
    delete state.events[key];
    return { lines: result.lines, died: !result.won, leveledUp: result.leveledUp, newLevel: result.newLevel };
  },
  treasure(state, key, data) {
    state.player.gold += data.gold;
    const xpGained = data.xp || 0;
    let leveledUp = false;
    if (xpGained) {
      state.player.xp += xpGained;
      leveledUp = checkLevelUp(state.player);
    }
    delete state.events[key];
    return { msg: '💰 ' + data.msg, cls: 'loot', xpGained, leveledUp, newLevel: state.player.level };
  },
  potion(state, key, data) {
    const p = state.player;
    p.hp = Math.min(p.hp + data.hp, p.maxHp);
    delete state.events[key];
    return { msg: `🧪 ${data.msg} (HP: ${p.hp}/${p.maxHp})`, cls: 'ok' };
  },
  trap(state, key, data) {
    const p = state.player;
    p.hp -= data.dmg;
    delete state.events[key];
    return { msg: `🩸 ${data.msg} (HP: ${Math.max(0, p.hp)}/${p.maxHp})`, cls: 'danger', died: p.hp <= 0 };
  },
  npc(state, key, data) {
    return { shop: data };
  },
};
