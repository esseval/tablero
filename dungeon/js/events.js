import { resolveAttackRound, checkLevelUp } from './combat.js';

export const EVENT_HANDLERS = {
  enemy(state, key, data) {
    // El combate se maneja desde tryAttack en game.js.
    // Este handler queda como respaldo por si se carga una partida
    // donde el jugador aparece sobre un enemigo.
    const result = resolveAttackRound(state, data);
    const r = { lines: result.lines, died: result.playerDied, leveledUp: result.leveledUp, newLevel: result.newLevel };
    if (result.died && !result.playerDied) delete state.events[key];
    return r;
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
    const available = data.items.filter(item => item.stock === undefined || item.stock > 0);
    return { shop: { ...data, items: available } };    
  },
};
