'use strict';

let currentFilter   = 'all';
let currentAchFilter = 'all';
let currentRTab     = 'levels';
let currentScreen   = 'home';

const App = {

  /* ── INIT ───────────────────────────────────────── */
  init() {
    loadState();
    Sound.init();
    Cosmetics.applyAll();
    Engine.tickStreak();
    Render.initAll();
    this._bindEvents();
    Profile.initAvatarUpload();
    Profile.initNameInput();

    if (state.totalXP === 0 && Cards.totalCards() === 0) {
      this._giveStarterCards();
    }

    const dailyResult = checkDailyBonus();
    if (dailyResult) {
      (state._pendingLoot || []).forEach(l => Cards.queueLoot(l));
      state._pendingLoot = [];
      if (dailyResult.reward?.type === 'xp' || dailyResult.reward?.type === 'loot_sp') {
        let threshold = getXPForLevel(state.level);
        while (state.xp >= threshold) {
          state.xp -= threshold;
          state.level++;
          Engine._onLevelUp(state.level);
          threshold = getXPForLevel(state.level);
        }
        Render.updateHeader();
        saveState();
      }
      setTimeout(() => Render.showDailyPopup(dailyResult), 900);
    }

    // Show first-launch name prompt on very first run
    if (isFirstLaunch()) {
      setTimeout(() => this._showFirstLaunch(), 400);
    }

    console.log('[NEXUS] ⚔️ Quest Manager geladen!');
    const summary = getSaveSummary();
    console.log(`[NEXUS] 💾 Save: ${summary.sizeKB}KB | LV${summary.level} | ${summary.totalXP} XP | ${summary.tasks} Tasks`);
  },

  _showFirstLaunch() {
    const ov = document.getElementById('ov-firstlaunch');
    if (!ov) return;
    ov.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    const input = document.getElementById('fl-name-input');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 200);
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') this.firstLaunchConfirm();
      });
    }
  },

  firstLaunchConfirm(skip = false) {
    if (!skip) {
      const input = document.getElementById('fl-name-input');
      const name  = input?.value?.trim();
      if (name && name.length >= 1) {
        state.username = name.toUpperCase().slice(0, 20);
        saveState();
        Render.updateHeader();
        Render.updateProfile();
      }
    }
    const ov = document.getElementById('ov-firstlaunch');
    if (ov) { ov.style.display = 'none'; }
    document.body.style.overflow = '';
    Render.toast(`Willkommen, ${state.username}! 🎉`, 'xp', 3500);
  },

  _giveStarterCards() {
    if (state.hasReceivedStarterBox) return;  // only once, ever
    state.hasReceivedStarterBox = true;
    Cards.queueLoot('basic');
    saveState();
    Render.toast('🎁 Willkommen! Öffne deine erste Basic Box!', 'card', 4000);
  },

  /* ── EVENTS ─────────────────────────────────────── */
  _bindEvents() {
    document.getElementById('task-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.addTask();
    });

    document.getElementById('notif-btn').addEventListener('click', () => this.toggleNotif());
    document.getElementById('notif-clear-btn').addEventListener('click', () => {
      state.notifications = [];
      state.unreadNotifs  = 0;
      saveState();
      Render.updateNotifications();
      document.getElementById('notif-dot').style.display = 'none';
    });
    document.getElementById('reset-btn').addEventListener('click', () => {
      if (resetState()) location.reload();
    });

    document.querySelectorAll('.overlay').forEach(ov => {
      ov.addEventListener('click', e => {
        if (e.target === ov && !this._forcedOvIds.has(ov.id)) this.closeOv(ov.id);
      });
    });
    // Card select overlay — close when clicking backdrop
    const csoOv = document.getElementById('card-select-overlay');
    if (csoOv) csoOv.addEventListener('click', e => { if (e.target === csoOv) this.closeCardSelectOverlay(); });
    document.addEventListener('click', e => {
      const panel = document.getElementById('notif-panel');
      const btn   = document.getElementById('notif-btn');
      if (!panel.contains(e.target) && !btn.contains(e.target)) panel.classList.remove('open');
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const open = document.querySelector('.overlay.open:not(.forced-overlay)');
        if (open) this.closeOv(open.id);
      }
    });
  },

  /* ── NAVIGATION ─────────────────────────────────── */
  navTo(name) {
    Sound?.navSwitch();
    currentScreen = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('s-' + name);
    if (target) {
      target.classList.add('active');
      const body = target.closest('.screen-body');
      if (body) body.scrollTop = 0;
    }
    document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('bnav-' + name);
    if (btn) btn.classList.add('active');

    if (name === 'tasks') {
      const activeTab = App._currentQuestTab || 'daily';
      App.questTab(activeTab, null, true);
    }
    if (name === 'achievements') { Render.updateAchievements(currentAchFilter); }
    if (name === 'profile')      { Render.updateProfile(); Render.updateLevelRewards(); Render.updateStreakRewards(); Render.updateCosmetics(); Render.updateGridInventory(); }
    if (name === 'home')         { Render.updateHomePreview(); Render.updateHeader(); Render.updateDaily7(); }
    if (name === 'shop')         { Render.updateShop(); }
  },

  profileTab(tab, btn) {
    document.querySelectorAll('.ptab').forEach(b => b.classList.remove('on'));
    if (btn) btn.classList.add('on');
    document.querySelectorAll('.prof-tab-content').forEach(el => el.style.display = 'none');
    const el = document.getElementById(`ptab-content-${tab}`);
    if (el) el.style.display = '';
    if (tab === 'inventory') { Render.updateGridInventory(); Render.renderInvCardList(); }
    if (tab === 'rewards')   { Render.updateLevelRewards(); Render.updateStreakRewards(); Render.updateCosmetics(); }
  },

  _currentQuestTab: 'daily',

  questTab(tab, btn, silent = false) {
    this._currentQuestTab = tab;

    // Update tab buttons
    document.querySelectorAll('.qtab').forEach(b => b.classList.remove('on'));
    if (btn) btn.classList.add('on');
    else {
      const b = document.getElementById(`qtab-${tab}`);
      if (b) b.classList.add('on');
    }

    // Show correct panel
    ['daily','weekly','custom'].forEach(t => {
      const p = document.getElementById(`qpanel-${t}`);
      if (p) p.style.display = t === tab ? '' : 'none';
    });

    // Refresh content
    if (tab === 'daily')  Render.updateDailyTasks();
    if (tab === 'weekly') Render.updateWeekly();
    if (tab === 'custom') Render.updateTasks(currentFilter);
  },

  /* legacy tab() shim for old render calls */
  tab(id, btn) { this.navTo(id.replace('p-', '')); },

  claimDailyFromHome() {
    const today   = todayISO();
    const claimed = state.dailyClaimedToday === today;
    if (claimed) {
      Render.toast('Heute bereits eingelöst!', '');
      return;
    }
    const result = checkDailyBonus();
    if (result) {
      // Flush pending loot (if Cards wasn't loaded during checkDailyBonus)
      (state._pendingLoot || []).forEach(l => Cards.queueLoot(l));
      state._pendingLoot = [];
      // Level-up check for XP rewards
      let threshold = getXPForLevel(state.level);
      while (state.xp >= threshold) {
        state.xp -= threshold;
        state.level++;
        Engine._onLevelUp(state.level);
        threshold = getXPForLevel(state.level);
      }
      saveState();
      Render.updateHeader();
      Render.updateStats();
      Render.updateDaily7();
      Render.showDailyPopup(result);
    }
  },

  completeDailyTask(taskId) {
    Sound?.dailyDone();
    const today = todayISO();
    if (state.dailyTasksDate !== today) {
      state.dailyTasksDone = [];
      state.dailyTasksDate = today;
    }
    if (state.dailyTasksDone.includes(taskId)) return;

    const task = DAILY_TASK_POOL.find(t => t.id === taskId);
    if (!task) return;

    let xp = CATEGORY_XP[task.xpKey] || 200;
    // daily_boost skill
    if (typeof SkillTree !== 'undefined' && SkillTree.isUnlocked('daily_boost')) {
      xp = Math.round(xp * 1.25);
    }

    state.dailyTasksDone.push(taskId);
    state.done++;
    state.catDone = state.catDone || {};
    Engine.advanceStreak();
    Engine.giveXP(xp, 'daily');

    // Daily task coin reward: 50–100 coins, +10% if premium
    let dailyCoins = 50 + Math.floor(Math.random() * 51);
    if (state.currencies?.premium) dailyCoins = Math.round(dailyCoins * 1.1);
    if (!state.currencies) state.currencies = { coins: 0, gems: 0, premium: false };
    state.currencies.coins += dailyCoins;
    Render.updateCurrencyDisplay();

    saveState();
    Render.updateDailyTasks();
    Render.updateHomePreview();
    Achievements.checkAll();
    Render.toast(`📅 Daily Task +${xp} XP!`, 'xp');
  },

  useInventoryCard(cardId) {
    // Highlight this card in the overlay (set forTask=null, grid opens)
    this.openInventoryOverlay(null);
  },

  invTab(tab, btn) {
    document.querySelectorAll('#ptab-content-inventory .ftab').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    document.getElementById('inv-tab-cards').style.display      = tab === 'cards'     ? '' : 'none';
    document.getElementById('inv-tab-cosmetics').style.display  = tab === 'cosmetics' ? '' : 'none';
  },
  rtab(id, btn) {
    currentRTab = id;
    document.querySelectorAll('.rtab').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    document.getElementById('r-levels').style.display  = id === 'levels'  ? '' : 'none';
    document.getElementById('r-streak').style.display  = id === 'streak'  ? '' : 'none';
    document.getElementById('r-cosm').style.display    = id === 'cosm'    ? '' : 'none';
    document.getElementById('r-karten').style.display  = id === 'karten'  ? '' : 'none';
    if (id === 'karten') Render.updateCardCatalog();
  },

  /** Navigate to shop and open a specific tab (coins / gems / premium / cosmetics) */
  navToShopTab(tab) {
    this.navTo('shop');
    // Shop renders async via updateShop(), so wait one frame before switching tab
    requestAnimationFrame(() => {
      requestAnimationFrame(() => Shop.switchTab(tab));
    });
  },
  addTask() {
    const input = document.getElementById('task-input');
    const name  = input.value.trim();
    if (!name) { input.focus(); Render.toast('Bitte einen Quest-Namen eingeben!', 'danger'); return; }
    const diff  = document.getElementById('diff-sel')?.value || 'normal';
    const xp    = getTaskXP(diff);
    state.tasks.push({ id: genId(), name, category: 'custom', difficulty: diff, xp, cardId: null, addedAt: Date.now() });
    input.value = '';
    input.focus();
    saveState();
    Render.updateTasks(currentFilter);
    Render.updateStats();
    Render.updateHomePreview();
  },

  /** Open inventory overlay (optionally bound to a task for card selection) */
  /** Open card selection grid overlay */
  openInventoryOverlay(forTaskId = null) {
    const ov = document.getElementById('card-select-overlay');
    if (!ov) return;
    ov.dataset.forTask = forTaskId || '';

    // Update title
    const titleEl = document.getElementById('cso-title');
    if (titleEl) {
      if (forTaskId) {
        const task = state.tasks.find(t => t.id === forTaskId);
        titleEl.textContent = task ? `🃏 Karte für: ${task.name.slice(0, 24)}` : '// KARTE WÄHLEN';
      } else {
        titleEl.textContent = '// KARTE WÄHLEN';
      }
    }

    // Render the grid into the overlay
    Render.updateCardSelectGrid(forTaskId);

    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeInventoryOverlay() {
    this.closeCardSelectOverlay();
  },

  closeCardSelectOverlay() {
    const ov = document.getElementById('card-select-overlay');
    if (ov) { ov.classList.remove('open'); document.body.style.overflow = ''; }
  },

  // Legacy shim
  closeCardCarousel() { this.closeCardSelectOverlay(); },

  addWeekly(weeklyId, name, icon) {
    if (state.weeklyTaken.includes(weeklyId)) return;
    state.weeklyTaken.push(weeklyId);
    state.tasks.push({ id: genId(), name: `${icon} ${name}`, category: 'weekly', cardId: null, weeklyId, addedAt: Date.now() });
    saveState();
    Render.updateTasks(currentFilter);
    Render.updateWeekly();
    Render.updateStats();
    Render.updateHomePreview();
    Render.toast(`📅 "${name}" hinzugefügt!`, '');
  },

  completeTask(taskId, evt = null) {
    const idx  = state.tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return;
    const task = state.tasks[idx];
    let baseXP = task.xp || CATEGORY_XP[task.category] || 100;

    // Track last completion time (for Focus card)
    const now = Date.now();
    const prevLastDone = state.lastTaskCompletedAt || 0;
    state.lastTaskCompletedAt = now;

    // Overdrive lock: skip XP
    if (state.overdriveLock) {
      state.overdriveLock = false;
      baseXP = 0;
      Render.toast('🔒 Overdrive: Reward gesperrt!', 'danger');
    }

    let streakReset = false;

    // Apply card effect
    const cardId   = task.cardId || state.pendingCard;
    const cardSlot = task.cardSlot ?? state.pendingCardSlot ?? null;

    let coinMultiplier = 1; // default

    if (cardId && baseXP > 0) {
      const card = getCard(cardId);
      if (card) {
        // lights_out: only works on micro/easy tasks
        if (card.type === 'lights_out' && task.difficulty !== 'micro') {
          Render.toast(`💡 Lights Out: Nur auf Easy-Tasks! Karte nicht eingesetzt.`, 'danger');
          // return card to inventory
          if (cardSlot !== null && cardSlot !== undefined) {
            state.gridInventory[cardSlot] = { cardId: card.id, quantity: 1 };
            Cards._syncStateCards();
          }
        } else {
          const rawResult = Cards.applyEffect(card, baseXP, task.addedAt);

          // Handle async (choices card returns a Promise)
          const applyResult = (result) => {
            baseXP         = result.xp;
            streakReset    = result.streakReset;
            coinMultiplier = result.coinMult ?? 1;
            if (result.blockNext) state.overdriveLock = true;
            finishTask();
          };

          // Remove card from slot
          if (cardSlot !== null && cardSlot !== undefined) {
            Cards.removeFromSlot(cardSlot);
          } else if (state.pendingCardSlot !== null && state.pendingCardSlot !== undefined) {
            Cards.removeFromSlot(state.pendingCardSlot);
          }
          state.pendingCard = null; state.pendingCardSlot = null;

          if (rawResult && typeof rawResult.then === 'function') {
            rawResult.then(applyResult);
            return; // finishTask called async
          }
          applyResult(rawResult);
          return;
        }
      }
      state.pendingCard = null; state.pendingCardSlot = null;
    }

    finishTask();

    function finishTask() {
    if (streakReset) {
      state.streak = 0;
    } else {
      Engine.advanceStreak();
    }

    state.done++;
    state.catDone = state.catDone || {};
    state.catDone[task.category] = (state.catDone[task.category] || 0) + 1;
    if (task.category === 'weekly') state.weeklyDone++;

    const today = todayStr();
    if (state.todayDate !== today) { state.todayDone = 0; state.todayDate = today; }
    state.todayDone++;

    const taskEl = document.querySelector(`[data-id="${taskId}"]`);
    const finish = () => {
      state.tasks.splice(idx, 1);
      Engine.giveXP(baseXP, task.difficulty || task.category, evt);
      Sound?.taskDone();

      // Coin reward: 10–40 coins based on difficulty, +10% if premium, ×coinMultiplier from cards
      const diffMap = { micro: 10, normal: 20, hard: 40 };
      let coinBase = diffMap[task.difficulty] || 20;
      if (state.currencies?.premium) coinBase = Math.round(coinBase * 1.1);
      if (!state.currencies) state.currencies = { coins: 0, gems: 0, premium: false };
      state.currencies.coins += Math.round(coinBase * coinMultiplier);
      Render.updateCurrencyDisplay();

      Render.updateTasks(currentFilter);
      Render.updateStats();
      Render.updateHomePreview();
      Render.updateGridInventory();
      if (task.weeklyId) Render.updateWeekly();
      saveState();
      Achievements.checkAll();
    };
    if (taskEl) { taskEl.classList.add('completing'); setTimeout(finish, 400); }
    else finish();
    } // end finishTask
  },

  skipTask(taskId) {
    const idx  = state.tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return;
    const task = state.tasks[idx];

    // bail_out: check if any inventory slot has the bail_out card (passive)
    const bailSlot = (state.gridInventory || []).findIndex(s => s.cardId === 'bail_out');
    if (bailSlot >= 0) {
      const bailCard = getCard('bail_out');
      Cards.removeFromSlot(bailSlot);
      Engine.giveXP(bailCard.value.xp, 'skip');
      Render.toast(`🚪 Bail Out! Quest geskippt → +${bailCard.value.xp} XP`, 'card');
    }

    state.skipped++;
    state.tasks.splice(idx, 1);
    saveState();
    Render.updateTasks(currentFilter);
    Render.updateStats();
    Render.updateHomePreview();
    if (bailSlot < 0) Render.toast('⏭️ Quest übersprungen', 'danger');
  },

  deleteTask(taskId) {
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    const wt = state.tasks.filter(t => t.weeklyId).map(t => t.weeklyId);
    state.weeklyTaken = wt;
    saveState();
    Render.updateTasks(currentFilter);
    Render.updateStats();
    Render.updateHomePreview();
  },

  /* ── CARD MODAL ─────────────────────────────────── */
  openCardModal(taskId) {
    // Open the grid inventory overlay, bound to this task
    this.openInventoryOverlay(taskId);
  },

  applyCard(taskId, cardId) {
    const task = state.tasks.find(t => t.id === taskId);
    const card = getCard(cardId);
    if (!task || !card) return;
    task.cardId = cardId;
    saveState();
    this.closeOv('ov-card');
    Render.updateTasks(currentFilter);
    Render.toast(`🃏 ${card.icon} ${card.name} auf Quest gelegt!`, 'card');
  },

  /* ── FILTER ─────────────────────────────────────── */
  setFilt(val, btn) {
    currentFilter = val;
    document.querySelectorAll('#task-filters .diff-ftab').forEach(b => b.classList.remove('on'));
    if (btn) btn.classList.add('on');
    Render.updateTasks(val);
  },

  setAchFilter(val, btn) {
    currentAchFilter = val;
    Render.updateAchievements(val);
  },

  /* ── NOTIFICATIONS ──────────────────────────────── */
  toggleNotif() {
    const panel = document.getElementById('notif-panel');
    const btn   = document.getElementById('notif-btn');
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
      panel.classList.remove('open');
    } else {
      panel.classList.add('open');
      state.notifications.forEach(n => n.read = true);
      state.unreadNotifs = 0;
      document.getElementById('notif-dot').style.display = 'none';
      saveState();
      Render.updateNotifications();
    }
  },

  /* ── MODALS ─────────────────────────────────────── */
  openOv(id)  { document.getElementById(id)?.classList.add('open');    document.body.style.overflow = 'hidden'; },
  closeOv(id) { document.getElementById(id)?.classList.remove('open'); document.body.style.overflow = ''; },

  // Forced overlays — cannot be closed by clicking outside or ESC
  _forcedOvIds: new Set(['ov-loot', 'ov-lu', 'ov-ach', 'ov-card-unlock']),
  openForcedOv(id)  {
    this._forcedOvIds.add(id);
    const el = document.getElementById(id);
    if (el) { el.classList.add('open', 'forced-overlay'); document.body.style.overflow = 'hidden'; }
  },
  closeForcedOv(id) {
    this._forcedOvIds.delete(id);
    const el = document.getElementById(id);
    if (el) { el.classList.remove('open', 'forced-overlay'); document.body.style.overflow = ''; }
    Render.updateLootboxInventory();

    // After level-up modal closes, show card-unlock popups one by one
    if (id === 'ov-lu' && this._levelUpCardUnlockQueue?.length) {
      const card = this._levelUpCardUnlockQueue.shift();
      this._showCardUnlockPopup(card);
    }
  },

  _levelUpCardUnlockQueue: [],

  toggleSound() {
    const muted = Sound.toggle();
    const btn = document.getElementById('sound-btn');
    if (btn) btn.textContent = muted ? '🔇' : '🔊';
  },

  _showCardUnlockPopup(card) {
    const rarityColors = {
      common:'rgba(140,155,165,.9)', rare:'rgba(41,121,255,1)',
      epic:'rgba(213,0,249,1)', legendary:'rgba(255,179,0,1)', mythic:'rgba(255,60,60,1)'
    };
    const rarityLabel = { common:'Common', rare:'Rare', epic:'Epic', legendary:'Legendary', mythic:'Mythic' };
    const rColor = rarityColors[card.rarity] || '#fff';

    document.getElementById('cu-ico').textContent   = card.icon;
    document.getElementById('cu-name').textContent  = card.name;
    document.getElementById('cu-name').style.color  = rColor;
    document.getElementById('cu-rar').textContent   = rarityLabel[card.rarity];
    document.getElementById('cu-rar').style.color   = rColor;
    document.getElementById('cu-rar').style.borderColor = rColor;
    document.getElementById('cu-desc').textContent  = card.desc;
    document.getElementById('cu-effect').textContent= card.effect;

    // Rarity glow on overlay
    const ov = document.getElementById('ov-card-unlock');
    if (ov) {
      ov.className = `overlay forced-overlay cu-rarity-${card.rarity}`;
    }

    this.openForcedOv('ov-card-unlock');
  },

};

document.addEventListener('DOMContentLoaded', () => App.init());
