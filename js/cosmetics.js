'use strict';

/**
 * Cosmetics — simplified to 2 types:
 *   type:'bg'  → Background cosmetic  (state.equippedBg)
 *   type:'ui'  → UI cosmetic          (state.equippedUi)
 */
const Cosmetics = {

  unlock(id) {
    if (!state.unlockedCosmetics) state.unlockedCosmetics = [];
    if (state.unlockedCosmetics.includes(id)) return;
    state.unlockedCosmetics.push(id);
    const cosm = COSMETICS.find(c => c.id === id);
    if (cosm) {
      addNotification(`🎨 Cosmetic freigeschaltet: <strong>${cosm.name}</strong>`);
      Render.toast(`🎨 ${cosm.name} freigeschaltet!`, '');
    }
    saveState();
    Render.updateCosmetics?.();
  },

  /** Equip a cosmetic by ID — handles both bg and ui types */
  equip(id) {
    const cosm = COSMETICS.find(c => c.id === id);
    if (!cosm) return;
    if (!state.unlockedCosmetics?.includes(id)) return;

    if (cosm.type === 'bg') {
      // Remove old bg class
      const oldId = state.equippedBg || 'bg-default';
      const old   = COSMETICS.find(c => c.id === oldId);
      if (old?.cssClass) document.body.classList.remove(old.cssClass);
      state.equippedBg = id;
    } else if (cosm.type === 'ui') {
      // Remove old ui class
      const oldId = state.equippedUi || 'ui-default';
      const old   = COSMETICS.find(c => c.id === oldId);
      if (old?.cssClass) document.body.classList.remove(old.cssClass);
      state.equippedUi = id;
    } else {
      // Legacy: theme / frame / effect — handled via state.equipped
      const slot = cosm.type;
      const oldId = state.equipped?.[slot];
      if (oldId) {
        const old = COSMETICS.find(c => c.id === oldId);
        if (old?.cssClass) document.body.classList.remove(old.cssClass);
      }
      if (!state.equipped) state.equipped = {};
      state.equipped[slot] = id;
    }

    if (cosm.cssClass) document.body.classList.add(cosm.cssClass);
    saveState();
    Render.updateCosmetics?.();
    Render.toast(`✅ ${cosm.name} ausgerüstet!`, '');
  },

  applyAll() {
    if (!state.unlockedCosmetics) return;

    // Apply bg
    const bgId   = state.equippedBg  || 'bg-default';
    const uiId   = state.equippedUi  || 'ui-default';
    const bgCosm = COSMETICS.find(c => c.id === bgId);
    const uiCosm = COSMETICS.find(c => c.id === uiId);
    if (bgCosm?.cssClass) document.body.classList.add(bgCosm.cssClass);
    if (uiCosm?.cssClass) document.body.classList.add(uiCosm.cssClass);

    // Legacy equipped slots
    Object.values(state.equipped || {}).forEach(id => {
      const cosm = COSMETICS.find(c => c.id === id);
      if (cosm?.cssClass) document.body.classList.add(cosm.cssClass);
    });

    // Legacy bg/effect
    const legBg  = COSMETICS.find(c => c.id === (state.equippedBg     || 'bg-default'));
    const legEff = COSMETICS.find(c => c.id === (state.equippedEffect || 'effect-none'));
    if (legBg?.cssClass)  document.body.classList.add(legBg.cssClass);
    if (legEff?.cssClass) document.body.classList.add(legEff.cssClass);
  },

  isEquipped(id) {
    return state.equippedBg  === id
        || state.equippedUi  === id
        || Object.values(state.equipped || {}).includes(id);
  },

  isUnlocked(id) {
    return state.unlockedCosmetics?.includes(id) || false;
  },

  getTitle() {
    const id   = state.equipped?.title;
    const cosm = COSMETICS.find(c => c.id === id);
    return cosm ? cosm.name : 'Bereit für Großes';
  },
};
