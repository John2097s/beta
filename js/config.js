'use strict';

/* ── INVENTORY GRID ───────────────────────────────────────────── */
const INV_COLS          = 6;
const INV_ROWS          = 4;
const INV_SLOTS         = 24;
const STACK_MAX_DEFAULT = 5;

/* ── PITY SYSTEM ─────────────────────────────────────────────── */
const PITY_EPIC_THRESHOLD       = 30;
const PITY_LEGENDARY_THRESHOLD  = 100;

/* ── TASK DIFFICULTIES ───────────────────────────────────────── */
const TASK_DIFFICULTIES = [
  { id: 'micro',  label: 'Mikro',  icon: '·', xp:  50 },
  { id: 'normal', label: 'Normal', icon: '▸', xp: 100 },
  { id: 'hard',   label: 'Schwer', icon: '▲', xp: 250 },
];
function getTaskXP(d) { const f = TASK_DIFFICULTIES.find(x => x.id === d); return f ? f.xp : 100; }

/* ── XP & LEVEL ──────────────────────────────────────────────── */
const LEVEL_BASE_XP = 500;
function getXPForLevel(level) {
  if (level < 10)  return 500;
  if (level < 25)  return 750;
  if (level < 50)  return 1000;
  return 1000 + Math.floor((level - 50) / 5) * 100;
}

const CATEGORY_XP = {
  work: 250, private: 200, gaming: 150,
  daily_easy: 100, daily_medium: 200, daily_hard: 300,
  weekly: 200,
};

/* ── LEVEL CLASSES ───────────────────────────────────────────── */
const LEVEL_CLASSES = [
  { level: 1,   name: 'Anfänger',  reward: 'Starter Box'        },
  { level: 5,   name: 'Einsteiger',reward: '📦 Basic Box'        },
  { level: 10,  name: 'Macher',    reward: '🎁 Advanced Box'     },
  { level: 20,  name: 'Grinder',   reward: '💠 Elite Box'        },
  { level: 35,  name: 'Veteran',   reward: '💠 Elite Box'        },
  { level: 50,  name: 'Pro',       reward: '🌌 Mythic Box'       },
  { level: 75,  name: 'Elite',     reward: '🌌 Mythic Box'       },
  { level: 100, name: 'Legende',   reward: '🌌 2× Mythic Box'    },
];
function getLevelClassName(lvl) {
  let cls = LEVEL_CLASSES[0];
  for (const c of LEVEL_CLASSES) { if (lvl >= c.level) cls = c; }
  return cls.name;
}
function getLevelClass(lvl) {
  for (const c of LEVEL_CLASSES) { if (lvl === c.level) return c; }
  return null;
}

/* ════════════════════════════════════════════════════════════════
   NEW CARD CATALOG — 11 cards
   ════════════════════════════════════════════════════════════════ */
const CARD_CATALOG = [

  // ── COMMON ─────────────────────────────────────────────────────
  {
    id: 'xp_plus', name: 'XP+', icon: '⚡', rarity: 'common',
    desc: '+50% XP auf die nächste abgeschlossene Quest.',
    effect: '×1.5 XP',
    type: 'xp_mult', value: 1.5,
    unlockLevel: 1,
  },

  // ── RARE ───────────────────────────────────────────────────────
  {
    id: 'double_xp', name: '2x XP', icon: '🌀', rarity: 'rare',
    desc: 'Verdoppelt die XP der nächsten Quest.',
    effect: '×2 XP',
    type: 'xp_mult', value: 2,
    unlockLevel: 3,
  },
  {
    id: 'chance', name: 'Chance', icon: '🎲', rarity: 'rare',
    desc: '50%: ×2 XP — 50%: nur 50% XP.',
    effect: '50/50 Glücksspiel',
    type: 'chance', value: { win: 2.0, lose: 0.5 },
    unlockLevel: 5,
  },
  {
    id: 'on_time', name: 'On Time', icon: '⏱️', rarity: 'rare',
    desc: '×3 XP wenn die Quest innerhalb von 30 Minuten abgeschlossen wird.',
    effect: '×3 XP (30 Min Limit)',
    type: 'on_time', value: { mult: 3, windowMs: 30 * 60 * 1000 },
    unlockLevel: 7,
  },
  {
    id: 'deck', name: 'Deck', icon: '🃏', rarity: 'rare',
    desc: 'Ziehe 3 zufällige Karten aus dem Loot-Pool.',
    effect: '+3 Zufallskarten',
    type: 'deck', value: 3,
    unlockLevel: 10,
  },

  // ── EPIC ───────────────────────────────────────────────────────
  {
    id: 'triple_xp', name: '3x XP', icon: '🔱', rarity: 'epic',
    desc: 'Verdreifacht die XP der nächsten Quest.',
    effect: '×3 XP',
    type: 'xp_mult', value: 3,
    unlockLevel: 15,
  },
  {
    id: 'shield', name: 'Shield', icon: '🛡️', rarity: 'epic',
    desc: 'Verhindert einmalig einen Streak-Verlust.',
    effect: 'Streak geschützt',
    type: 'shield', value: 1,
    unlockAchievement: 'streak_7',
  },
  {
    id: 'overdrive', name: 'Overdrive', icon: '🔥', rarity: 'epic',
    desc: '+200% XP, aber der nächste Task-Reward ist deaktiviert.',
    effect: '×3 XP, nächster Reward gesperrt',
    type: 'overdrive', value: 3,
    unlockAchievement: 'task_50',
  },
  {
    id: 'focus', name: 'Focus', icon: '🎯', rarity: 'epic',
    desc: '+200% XP — aber NUR wenn in der letzten Stunde kein anderer Task abgeschlossen wurde.',
    effect: '×3 XP (Solo-Bedingung)',
    type: 'focus', value: { mult: 3, windowMs: 60 * 60 * 1000 },
    unlockAchievement: 'task_100',
  },

  // ── LEGENDARY ──────────────────────────────────────────────────
  {
    id: 'jackpot', name: 'Jackpot', icon: '🎰', rarity: 'legendary',
    desc: 'Zufälliger Multiplikator: 0× bis 20× XP.',
    effect: 'Random ×0–×20 XP',
    type: 'jackpot', value: { min: 0, max: 20 },
    unlockLevel: 25,
  },

  // ── MYTHIC ─────────────────────────────────────────────────────
  {
    id: 'fate_split', name: 'Fate Split', icon: '🌌', rarity: 'mythic',
    desc: '50%: 0 XP + Streak-Reset — 50%: ×10 XP + Bonus Lootbox.',
    effect: '50/50: Ruin oder Triumph',
    type: 'fate_split', value: { win_mult: 10, win_loot: 'advanced' },
    unlockLevel: 40,
  },

  // ── NEW CARDS ─────────────────────────────────────────────────

  {
    id: 'all_in', name: 'All In', icon: '🪙', rarity: 'legendary',
    desc: '50% Chance: +10 Levels. 50% Chance: Alle Karten verloren + Streak Reset.',
    effect: '50/50: +10 Level oder Totalverlust',
    type: 'all_in', value: { winLevels: 10 },
    unlockLevel: 30,
  },
  {
    id: 'streak_player', name: 'Streak Player', icon: '🔗', rarity: 'epic',
    desc: 'XP wird mit deinem aktuellen Streak multipliziert.',
    effect: 'XP × Streak-Anzahl',
    type: 'streak_player', value: null,
    unlockLevel: 12,
  },
  {
    id: 'pig', name: 'Pig', icon: '🐷', rarity: 'rare',
    desc: 'Erhalte 1.5× mehr Coins für diese Quest.',
    effect: '×1.5 Coins',
    type: 'coin_mult', value: 1.5,
    unlockLevel: 8,
  },
  {
    id: 'joker', name: 'Joker', icon: '🃏', rarity: 'legendary',
    desc: 'Quest wird als abgeschlossen gewertet — ohne sie wirklich zu erledigen.',
    effect: 'Task Auto-Complete',
    type: 'joker', value: null,
    unlockLevel: 20,
  },
  {
    id: 'lights_out', name: 'Lights Out', icon: '💡', rarity: 'rare',
    desc: 'Gibt 141 XP auf Easy-Tasks. Nur auf Easy-Tasks einsetzbar.',
    effect: '+141 XP (nur Easy)',
    type: 'lights_out', value: { xp: 141, difficulty: 'micro' },
    unlockLevel: 6,
  },
  {
    id: 'twenty_one', name: '"21"', icon: '🎴', rarity: 'mythic',
    desc: 'Gibt 21× mehr XP auf die nächste Quest.',
    effect: '×21 XP',
    type: 'xp_mult', value: 21,
    unlockLevel: 35,
  },
  {
    id: 'bail_out', name: 'Bail Out', icon: '🚪', rarity: 'epic',
    desc: 'Passiv: Liegt im Inventar. Überspringe eine Quest und erhalte trotzdem 200 XP.',
    effect: 'Skip → +200 XP (Passiv)',
    type: 'bail_out', value: { xp: 200 },
    unlockLevel: 18,
  },
  {
    id: 'pandora', name: 'Pandora', icon: '📦', rarity: 'legendary',
    desc: 'Entweder eine zufällige Lootbox oder eine zufällige Karte aus dem Loot-Pool.',
    effect: 'Random Lootbox ODER Karte',
    type: 'pandora', value: null,
    unlockLevel: 22,
  },
  {
    id: 'cash_out', name: 'Cash Out', icon: '💰', rarity: 'epic',
    desc: 'Erhalte 2× mehr Coins für diese Quest.',
    effect: '×2 Coins',
    type: 'coin_mult', value: 2,
    unlockLevel: 14,
  },
  {
    id: 'choices', name: 'Choices to Make', icon: '⚖️', rarity: 'legendary',
    desc: 'Wähle: 2× Coins (0 XP) oder 2× XP (0 Coins).',
    effect: 'Coins×2 und 0XP — oder XP×2 und 0 Coins',
    type: 'choices', value: { xpMult: 2, coinMult: 2 },
    unlockLevel: 28,
  },
  {
    id: 'burn_em', name: "Burn 'em", icon: '🔥', rarity: 'mythic',
    desc: 'Verbrennt alle Karten im Inventar. XP × Anzahl der verbrannten Karten (max. ×24).',
    effect: 'XP × Karten-Anzahl (bis ×24)',
    type: 'burn_em', value: { max: 24 },
    unlockLevel: 45,
  },
];

function getCard(id) { return CARD_CATALOG.find(c => c.id === id); }

/* ── CARD UNLOCK SYSTEM ──────────────────────────────────────── */
// Returns all card IDs currently available in loot pools based on player state
function getUnlockedCardPool(playerState) {
  const achUnlocked = getAchievementUnlockedCards(playerState);
  return CARD_CATALOG.filter(card => {
    // Achievement-gated cards (shield, overdrive, focus, deck)
    if (card.unlockAchievement) {
      return achUnlocked.has(card.id) || playerState.achievements?.includes(card.unlockAchievement);
    }
    // Level-gated cards
    if (card.unlockLevel && playerState.level < card.unlockLevel) return false;
    return true;
  }).map(c => c.id);
}

/* ── LOOTBOX DEFINITIONS ─────────────────────────────────────── */
const LOOTBOX_DEFS = {

  // Basic Box — 2 cards, Common 70% / Rare 30%
  basic: {
    name: 'Basic Box', icon: '📦', cards: 2,
    pool: [
      { rarity: 'common', weight: 70 },
      { rarity: 'rare',   weight: 30 },
    ],
  },

  // Advanced Box — 3 cards, Rare 60% / Epic 30% / Legendary 10%
  advanced: {
    name: 'Advanced Box', icon: '🎁', cards: 3,
    pool: [
      { rarity: 'rare',      weight: 60 },
      { rarity: 'epic',      weight: 30 },
      { rarity: 'legendary', weight: 10 },
    ],
  },

  // Elite Box — 3 cards, Epic 40% / Legendary 49% / Mythic 1%
  elite: {
    name: 'Elite Box', icon: '💠', cards: 3,
    pool: [
      { rarity: 'epic',      weight: 40 },
      { rarity: 'legendary', weight: 49 },
      { rarity: 'mythic',    weight:  1 },
    ],
  },

  // Mythic Box — 1 card, Legendary 50% / Mythic 50%
  mythic: {
    name: 'Mythic Box', icon: '🌌', cards: 2,
    pool: [
      { rarity: 'legendary', weight: 50 },
      { rarity: 'mythic',    weight: 50 },
    ],
  },

  // Legacy aliases — point to correct new definitions
  small:     { name: 'Basic Box',    icon: '📦', cards: 2, pool: [{ rarity: 'common', weight: 70 }, { rarity: 'rare', weight: 30 }] },
  big:       { name: 'Advanced Box', icon: '🎁', cards: 3, pool: [{ rarity: 'rare', weight: 60 }, { rarity: 'epic', weight: 30 }, { rarity: 'legendary', weight: 10 }] },
  premium:   { name: 'Elite Box',    icon: '💠', cards: 3, pool: [{ rarity: 'epic', weight: 40 }, { rarity: 'legendary', weight: 49 }, { rarity: 'mythic', weight: 1 }] },
  epic:      { name: 'Elite Box',    icon: '💠', cards: 3, pool: [{ rarity: 'epic', weight: 40 }, { rarity: 'legendary', weight: 49 }, { rarity: 'mythic', weight: 1 }] },
  legendary: { name: 'Mythic Box',   icon: '🌌', cards: 2, pool: [{ rarity: 'legendary', weight: 50 }, { rarity: 'mythic', weight: 50 }] },
};

/* ── ACHIEVEMENTS ────────────────────────────────────────────── */
/*
 * reward field: shown in UI
 * unlocks field: card id added to loot pool (for unlock-gate cards)
 * grant function: executed when achievement fires
 *
 * Cards gated by achievement:
 *   shield    → streak_7
 *   overdrive → task_50
 *   focus     → task_100
 *   deck      → level_10 (level 10)
 */
const ACHIEVEMENTS = [

  // ── CONSISTENCY (Streak) ──────────────────────────────────────
  { id: 'streak_3', icon: '🔥', name: 'Erste Flamme', category: 'streak',
    desc: '3-Tage Streak aufbauen',
    reward: '+500 Bonus XP',
    check: s => s.streak >= 3,
    grant: s => { s.xp += 500; s.totalXP += 500; } },

  { id: 'streak_7', icon: '🛡️', name: 'Eine Woche!', category: 'streak',
    desc: '7-Tage Streak',
    reward: '🔓 Shield-Karte freigeschaltet',
    unlocks: 'shield',
    check: s => s.streak >= 7,
    grant: s => { /* shield unlocked via pool — no direct card */ } },

  { id: 'streak_14', icon: '🔥🔥', name: 'Zwei Wochen!', category: 'streak',
    desc: '14-Tage Streak',
    reward: '🎁 Advanced Box',
    check: s => s.streak >= 14,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'streak_30', icon: '⚡', name: 'Ein Monat!', category: 'streak',
    desc: '30-Tage Streak',
    reward: '🌌 Mythic Box',
    check: s => s.streak >= 30,
    grant: s => { Cards.queueLoot('mythic'); } },

  // ── PRODUCTIVITY (Tasks) ──────────────────────────────────────
  { id: 'task_10', icon: '✅', name: 'In den Rhythmus', category: 'tasks',
    desc: '10 Quests abschließen',
    reward: '📦 Basic Lootbox',
    check: s => s.done >= 10,
    grant: s => { Cards.queueLoot('basic'); } },

  { id: 'task_50', icon: '🔥', name: 'Overdrive!', category: 'tasks',
    desc: '50 Quests abschließen',
    reward: '🔓 Overdrive-Karte + Advanced Box',
    unlocks: 'overdrive',
    check: s => s.done >= 50,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'task_100', icon: '👑', name: 'Centurion', category: 'tasks',
    desc: '100 Quests abschließen',
    reward: '🔓 Focus-Karte + Premium Box',
    unlocks: 'focus',
    check: s => s.done >= 100,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'task_500', icon: '🌟', name: 'Legende', category: 'tasks',
    desc: '500 Quests abschließen',
    reward: '🌌 Mythic Box',
    check: s => s.done >= 500,
    grant: s => { Cards.queueLoot('mythic'); } },

  // ── GAMEPLAY (Lootboxen & Karten) ────────────────────────────
  { id: 'boxes_5', icon: '📦', name: 'Sammler', category: 'gameplay',
    desc: '5 Lootboxen öffnen',
    reward: '+1000 Bonus XP',
    check: s => (s.totalBoxesOpened || 0) >= 5,
    grant: s => { s.xp += 1000; s.totalXP += 1000; } },

  { id: 'cards_10', icon: '🃏', name: 'Kartenspieler', category: 'gameplay',
    desc: '10 Karten benutzen',
    reward: '📦 Basic Lootbox',
    check: s => (s.cardsUsed || 0) >= 10,
    grant: s => { Cards.queueLoot('basic'); } },

  { id: 'cards_25', icon: '🎴', name: 'Kartenmeister', category: 'gameplay',
    desc: '25 Karten benutzen',
    reward: '🎁 Advanced Lootbox',
    check: s => (s.cardsUsed || 0) >= 25,
    grant: s => { Cards.queueLoot('advanced'); } },

  // ── PROGRESSION (Level) ───────────────────────────────────────
  { id: 'level_5', icon: '⭐', name: 'Aufsteiger', category: 'progression',
    desc: 'Level 5 erreichen',
    reward: '📦 Basic Lootbox',
    check: s => s.level >= 5,
    grant: s => { Cards.queueLoot('basic'); } },

  { id: 'level_10', icon: '🃏', name: 'Deck Meister', category: 'progression',
    desc: 'Level 10 erreichen',
    reward: '🔓 Deck-Karte freigeschaltet',
    unlocks: 'deck',
    check: s => s.level >= 10,
    grant: s => { /* deck card unlocked via pool */ } },

  { id: 'level_20', icon: '💎', name: 'Veteran', category: 'progression',
    desc: 'Level 20 erreichen',
    reward: '🎁 Advanced Lootbox',
    check: s => s.level >= 20,
    grant: s => { Cards.queueLoot('advanced'); } },

  // ── HIDDEN ────────────────────────────────────────────────────
  { id: 'lucky_gamble', icon: '🎰', name: 'Glücksgriff', category: 'special', hidden: true,
    desc: '???', reward: '🎁 Advanced Box',
    check: s => (s.wonGamble || 0) >= 1,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'first_task', icon: '👣', name: 'Erster Schritt', category: 'tasks', hidden: true,
    desc: '???', reward: '+200 Bonus XP',
    check: s => s.done >= 1,
    grant: s => { s.xp += 200; s.totalXP += 200; } },

  // ── STREAK (additional) ───────────────────────────────────────
  { id: 'streak_2', icon: '🌱', name: 'Anfang gemacht', category: 'streak',
    desc: '2-Tage Streak', reward: '+100 XP',
    check: s => s.streak >= 2,
    grant: s => { s.xp += 100; s.totalXP += 100; } },

  { id: 'streak_5', icon: '🔥', name: 'Warm werden', category: 'streak',
    desc: '5-Tage Streak', reward: '+300 XP',
    check: s => s.streak >= 5,
    grant: s => { s.xp += 300; s.totalXP += 300; } },

  { id: 'streak_21', icon: '🗓️', name: 'Drei Wochen!', category: 'streak',
    desc: '21-Tage Streak', reward: '🎁 Advanced Box',
    check: s => s.streak >= 21,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'streak_50', icon: '💪', name: 'Unaufhaltsam', category: 'streak',
    desc: '50-Tage Streak', reward: '💠 Elite Box',
    check: s => s.streak >= 50,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'streak_100', icon: '🏆', name: 'Legende des Streaks', category: 'streak',
    desc: '100-Tage Streak', reward: '🌌 Mythic Box',
    check: s => s.streak >= 100,
    grant: s => { Cards.queueLoot('mythic'); } },

  { id: 'streak_max', icon: '👑', name: 'Streakgott', category: 'streak',
    desc: '365-Tage Streak', reward: '🌌 2× Mythic Box',
    check: s => s.streak >= 365,
    grant: s => { Cards.queueLoot('mythic'); Cards.queueLoot('mythic'); } },

  // ── TASKS (additional) ────────────────────────────────────────
  { id: 'task_5', icon: '✅', name: 'Warmer Start', category: 'tasks',
    desc: '5 Quests abschließen', reward: '+250 XP',
    check: s => s.done >= 5,
    grant: s => { s.xp += 250; s.totalXP += 250; } },

  { id: 'task_25', icon: '🏅', name: 'Auf dem Weg', category: 'tasks',
    desc: '25 Quests abschließen', reward: '📦 Basic Box',
    check: s => s.done >= 25,
    grant: s => { Cards.queueLoot('basic'); } },

  { id: 'task_75', icon: '🥇', name: 'Fleißig', category: 'tasks',
    desc: '75 Quests abschließen', reward: '🎁 Advanced Box',
    check: s => s.done >= 75,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'task_200', icon: '💼', name: 'Workaholic', category: 'tasks',
    desc: '200 Quests abschließen', reward: '💠 Elite Box',
    check: s => s.done >= 200,
    grant: s => { Cards.queueLoot('elite'); } },

  { id: 'task_1000', icon: '🌌', name: 'Tausend Quests', category: 'tasks',
    desc: '1000 Quests abschließen', reward: '🌌 Mythic Box + 500 Gems',
    check: s => s.done >= 1000,
    grant: s => { Cards.queueLoot('mythic'); if (!s.currencies) s.currencies = {coins:0,gems:0,premium:false}; s.currencies.gems += 500; } },

  { id: 'daily_10', icon: '📅', name: 'Zuverlässig', category: 'tasks',
    desc: '10 Daily Quests an einem Tag', reward: '+500 XP',
    check: s => (s.todayDone || 0) >= 10,
    grant: s => { s.xp += 500; s.totalXP += 500; } },

  { id: 'weekly_done_1', icon: '📆', name: 'Wochenchampion', category: 'tasks',
    desc: '1 Weekly Challenge abschließen', reward: '+300 XP',
    check: s => (s.weeklyDone || 0) >= 1,
    grant: s => { s.xp += 300; s.totalXP += 300; } },

  { id: 'weekly_done_5', icon: '🏆', name: 'Weekly Veteran', category: 'tasks',
    desc: '5 Weekly Challenges abschließen', reward: '🎁 Advanced Box',
    check: s => (s.weeklyDone || 0) >= 5,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'hard_10', icon: '💀', name: 'Harter Kern', category: 'tasks',
    desc: '10 Hard-Quests abschließen', reward: '+800 XP',
    check: s => (s.catDone?.hard || 0) >= 10,
    grant: s => { s.xp += 800; s.totalXP += 800; } },

  { id: 'skip_0', icon: '🚫', name: 'Kein Entkommen', category: 'tasks', hidden: true,
    desc: '???', reward: '💠 Elite Box',
    check: s => s.done >= 50 && (s.skipped || 0) === 0,
    grant: s => { Cards.queueLoot('advanced'); } },

  // ── GAMEPLAY (additional) ─────────────────────────────────────
  { id: 'boxes_1', icon: '📦', name: 'Erste Box', category: 'gameplay',
    desc: 'Erste Lootbox öffnen', reward: '+200 XP',
    check: s => (s.totalBoxesOpened || 0) >= 1,
    grant: s => { s.xp += 200; s.totalXP += 200; } },

  { id: 'boxes_10', icon: '📦', name: 'Box Enthusiast', category: 'gameplay',
    desc: '10 Lootboxen öffnen', reward: '🎁 Advanced Box',
    check: s => (s.totalBoxesOpened || 0) >= 10,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'boxes_25', icon: '🎁', name: 'Box Junkie', category: 'gameplay',
    desc: '25 Lootboxen öffnen', reward: '💠 Elite Box',
    check: s => (s.totalBoxesOpened || 0) >= 25,
    grant: s => { Cards.queueLoot('elite'); } },

  { id: 'boxes_50', icon: '🎰', name: 'Box König', category: 'gameplay',
    desc: '50 Lootboxen öffnen', reward: '🌌 Mythic Box',
    check: s => (s.totalBoxesOpened || 0) >= 50,
    grant: s => { Cards.queueLoot('mythic'); } },

  { id: 'elite_box_1', icon: '💠', name: 'Elitär', category: 'gameplay', hidden: true,
    desc: '???', reward: '💠 Elite Box',
    check: s => (s.storedLootboxes || []).some(b => b.type === 'elite') || (s.totalBoxesOpened || 0) >= 1,
    grant: s => { Cards.queueLoot('basic'); } },

  { id: 'cards_1', icon: '🃏', name: 'Erstes Blatt', category: 'gameplay',
    desc: 'Erste Karte benutzen', reward: '+150 XP',
    check: s => (s.cardsUsed || 0) >= 1,
    grant: s => { s.xp += 150; s.totalXP += 150; } },

  { id: 'cards_5', icon: '🃏', name: 'Karten-Fan', category: 'gameplay',
    desc: '5 Karten benutzen', reward: '📦 Basic Box',
    check: s => (s.cardsUsed || 0) >= 5,
    grant: s => { Cards.queueLoot('basic'); } },

  { id: 'cards_50', icon: '🎴', name: 'Karten-Legende', category: 'gameplay',
    desc: '50 Karten benutzen', reward: '💠 Elite Box',
    check: s => (s.cardsUsed || 0) >= 50,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'cards_100', icon: '🃏', name: 'Kartenmeister 2.0', category: 'gameplay',
    desc: '100 Karten benutzen', reward: '🌌 Mythic Box',
    check: s => (s.cardsUsed || 0) >= 100,
    grant: s => { Cards.queueLoot('mythic'); } },

  { id: 'lucky_3', icon: '🍀', name: 'Dreimal Glück', category: 'gameplay',
    desc: '3× Glückspiel gewonnen', reward: '💠 Elite Box',
    check: s => (s.wonGamble || 0) >= 3,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'all_in_win', icon: '🪙', name: 'All In Champion', category: 'gameplay', hidden: true,
    desc: '???', reward: '🌌 Mythic Box',
    check: s => (s.wonGamble || 0) >= 5,
    grant: s => { Cards.queueLoot('mythic'); } },

  { id: 'coins_1000', icon: '🟡', name: 'Sparschwein', category: 'gameplay',
    desc: '1.000 Coins insgesamt gesammelt', reward: '+500 XP',
    check: s => (s.totalCoinsEarned || 0) >= 1000,
    grant: s => { s.xp += 500; s.totalXP += 500; } },

  { id: 'coins_10000', icon: '💰', name: 'Münzmagnat', category: 'gameplay',
    desc: '10.000 Coins insgesamt gesammelt', reward: '💠 Elite Box',
    check: s => (s.totalCoinsEarned || 0) >= 10000,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'full_inventory', icon: '🎒', name: 'Voll beladen', category: 'gameplay', hidden: true,
    desc: '???', reward: '🌌 Mythic Box',
    check: s => (s.gridInventory || []).every(slot => slot.cardId),
    grant: s => { Cards.queueLoot('mythic'); } },

  // ── PROGRESSION (additional) ──────────────────────────────────
  { id: 'level_1', icon: '🌱', name: 'Willkommen', category: 'progression',
    desc: 'Level 1 erreichen', reward: '+50 XP',
    check: s => s.level >= 1,
    grant: s => { s.xp += 50; s.totalXP += 50; } },

  { id: 'level_3', icon: '⭐', name: 'Erste Schritte', category: 'progression',
    desc: 'Level 3 erreichen', reward: '+200 XP',
    check: s => s.level >= 3,
    grant: s => { s.xp += 200; s.totalXP += 200; } },

  { id: 'level_15', icon: '💫', name: 'Halbzeit', category: 'progression',
    desc: 'Level 15 erreichen', reward: '📦 Basic Box',
    check: s => s.level >= 15,
    grant: s => { Cards.queueLoot('basic'); } },

  { id: 'level_30', icon: '🔥', name: 'Erfahren', category: 'progression',
    desc: 'Level 30 erreichen', reward: '🎁 Advanced Box',
    check: s => s.level >= 30,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'level_40', icon: '💎', name: 'Experte', category: 'progression',
    desc: 'Level 40 erreichen', reward: '💠 Elite Box',
    check: s => s.level >= 40,
    grant: s => { Cards.queueLoot('elite'); } },

  { id: 'level_50', icon: '👑', name: 'Meister', category: 'progression',
    desc: 'Level 50 erreichen', reward: '🌌 Mythic Box',
    check: s => s.level >= 50,
    grant: s => { Cards.queueLoot('mythic'); } },

  { id: 'level_75', icon: '🌟', name: 'Elite Spieler', category: 'progression',
    desc: 'Level 75 erreichen', reward: '🌌 Mythic Box + 200 Gems',
    check: s => s.level >= 75,
    grant: s => { Cards.queueLoot('mythic'); if (!s.currencies) s.currencies = {coins:0,gems:0,premium:false}; s.currencies.gems += 200; } },

  { id: 'level_100', icon: '🏆', name: 'Legende', category: 'progression',
    desc: 'Level 100 erreichen', reward: '🌌 3× Mythic Box + 500 Gems',
    check: s => s.level >= 100,
    grant: s => { Cards.queueLoot('mythic'); Cards.queueLoot('mythic'); Cards.queueLoot('mythic'); if (!s.currencies) s.currencies = {coins:0,gems:0,premium:false}; s.currencies.gems += 500; } },

  { id: 'xp_5000', icon: '⚡', name: 'XP Hunger', category: 'progression',
    desc: '5.000 Gesamt-XP', reward: '📦 Basic Box',
    check: s => s.totalXP >= 5000,
    grant: s => { Cards.queueLoot('basic'); } },

  { id: 'xp_25000', icon: '⚡', name: 'XP Monster', category: 'progression',
    desc: '25.000 Gesamt-XP', reward: '🎁 Advanced Box',
    check: s => s.totalXP >= 25000,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'xp_100000', icon: '🌌', name: 'XP Gott', category: 'progression',
    desc: '100.000 Gesamt-XP', reward: '💠 Elite Box',
    check: s => s.totalXP >= 100000,
    grant: s => { Cards.queueLoot('elite'); } },

  // ── SPECIAL / HIDDEN ──────────────────────────────────────────
  { id: 'night_owl', icon: '🦉', name: 'Nachteule', category: 'special', hidden: true,
    desc: '???', reward: '📦 Basic Box',
    check: s => { const h = new Date().getHours(); return s.done >= 1 && (h >= 23 || h <= 4); },
    grant: s => { Cards.queueLoot('basic'); } },

  { id: 'speed_run', icon: '⚡', name: 'Speedrunner', category: 'special', hidden: true,
    desc: '???', reward: '🎁 Advanced Box',
    check: s => (s.todayDone || 0) >= 5,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'no_skip_10', icon: '🎯', name: 'Kein Ausweg', category: 'special', hidden: true,
    desc: '???', reward: '+1000 XP',
    check: s => s.done >= 10 && (s.skipped || 0) === 0,
    grant: s => { s.xp += 1000; s.totalXP += 1000; } },

  { id: 'burn_em_used', icon: '🔥', name: 'Alles verbrennen', category: 'special', hidden: true,
    desc: '???', reward: '💠 Elite Box',
    check: s => (s.cardsUsed || 0) >= 1 && s.gridInventory?.every(sl => !sl.cardId),
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'comeback', icon: '💫', name: 'Comeback', category: 'special', hidden: true,
    desc: '???', reward: '🎁 Advanced Box',
    check: s => s.streak >= 3 && (s.maxStreak || 0) > 7,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'pandora_used', icon: '📦', name: 'Büchse der Pandora', category: 'special', hidden: true,
    desc: '???', reward: '🎁 Advanced Box',
    check: s => (s.cardsUsed || 0) >= 1,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'first_legendary', icon: '🌟', name: 'Legende erhalten', category: 'special', hidden: true,
    desc: '???', reward: '+2000 XP',
    check: s => Object.keys(s.cards || {}).some(id => { const c = CARD_CATALOG.find(c=>c.id===id); return c?.rarity === 'legendary'; }),
    grant: s => { s.xp += 2000; s.totalXP += 2000; } },

  { id: 'first_mythic', icon: '🌌', name: 'Mythisch', category: 'special', hidden: true,
    desc: '???', reward: '+5000 XP',
    check: s => Object.keys(s.cards || {}).some(id => { const c = CARD_CATALOG.find(c=>c.id===id); return c?.rarity === 'mythic'; }),
    grant: s => { s.xp += 5000; s.totalXP += 5000; } },

  { id: 'rich', icon: '💰', name: 'Steinreich', category: 'special', hidden: true,
    desc: '???', reward: '💠 Elite Box',
    check: s => (s.currencies?.coins || 0) >= 5000,
    grant: s => { Cards.queueLoot('advanced'); } },

  { id: 'gem_hoarder', icon: '💎', name: 'Gem Hoarder', category: 'special', hidden: true,
    desc: '???', reward: '+100 Gems',
    check: s => (s.currencies?.gems || 0) >= 100,
    grant: s => { if (!s.currencies) s.currencies = {coins:0,gems:0,premium:false}; s.currencies.gems += 100; } },

  { id: 'max_streak_10', icon: '🔥', name: 'Maximaler Brenner', category: 'special',
    desc: 'Maximalen Streak von 10 erreichen', reward: '+1000 XP',
    check: s => (s.maxStreak || 0) >= 10,
    grant: s => { s.xp += 1000; s.totalXP += 1000; } },
];

/* ── ACHIEVEMENT UNLOCK HELPERS ──────────────────────────────── */
// Returns set of card IDs that are unlocked via achievements
function getAchievementUnlockedCards(playerState) {
  const unlocked = new Set();
  for (const ach of ACHIEVEMENTS) {
    if (ach.unlocks && playerState.achievements?.includes(ach.id)) {
      unlocked.add(ach.unlocks);
    }
  }
  return unlocked;
}

/* ── STREAK REWARDS ──────────────────────────────────────────── */
const STREAK_REWARDS = [
  { streak: 3,   reward: 'basic',    text: '📦 Basic Box'    },
  { streak: 7,   reward: 'advanced', text: '🎁 Advanced Box' },
  { streak: 14,  reward: 'advanced', text: '🎁 Advanced Box' },
  { streak: 30,  reward: 'elite',    text: '💠 Elite Box'  },
  { streak: 60,  reward: 'mythic',   text: '🌌 Mythic Box'   },
  { streak: 100, reward: 'mythic',   text: '🌌 Mythic Box'   },
];

/* ── WEEKLY CHALLENGES ───────────────────────────────────────── */
const WEEKLY_POOL = [
  { id: 'w1', icon: '🏃', name: '30 Min Sport'           },
  { id: 'w2', icon: '📚', name: 'Buch lesen (1 Kapitel)' },
  { id: 'w3', icon: '🧹', name: 'Zimmer aufräumen'        },
  { id: 'w4', icon: '🥗', name: 'Gesund essen heute'      },
  { id: 'w5', icon: '💧', name: '2L Wasser trinken'       },
  { id: 'w6', icon: '🧘', name: '10 Min Meditation'       },
  { id: 'w7', icon: '📝', name: 'Tagebuch schreiben'      },
  { id: 'w8', icon: '👥', name: 'Freunde kontaktieren'    },
  { id: 'w9', icon: '🎯', name: 'Ziel für morgen setzen'  },
];

const WEEKLY_CHALLENGES = [
  { id: 'wc1', icon: '🏃', name: '7 Tage Sport-Streak', steps: 7,  xp: 200, loot: 'advanced', category: 'fitness'  },
  { id: 'wc2', icon: '📚', name: 'Lese-Marathon',        steps: 5,  xp: 200, loot: 'basic',    category: 'learning' },
  { id: 'wc3', icon: '💧', name: 'Hydrations-Challenge', steps: 7,  xp: 150, loot: 'basic',    category: 'health'   },
  { id: 'wc4', icon: '🎯', name: 'Fokus-Woche',          steps: 5,  xp: 250, loot: 'advanced', category: 'work'     },
  { id: 'wc5', icon: '🌟', name: 'Meister-Challenge',    steps: 14, xp: 200, loot: 'elite',    category: 'special'  },
];

/* ── DAILY TASKS POOL ────────────────────────────────────────── */
const DAILY_TASK_POOL = [
  { id: 'd1',  icon: '🏃', name: '15 Min Sport',                xpKey: 'daily_easy'   },
  { id: 'd2',  icon: '💧', name: '2L Wasser trinken',           xpKey: 'daily_easy'   },
  { id: 'd3',  icon: '🛏️', name: 'Pünktlich ins Bett',          xpKey: 'daily_easy'   },
  { id: 'd4',  icon: '📚', name: '20 Min lesen',                xpKey: 'daily_medium' },
  { id: 'd5',  icon: '🧘', name: '10 Min Meditation',           xpKey: 'daily_medium' },
  { id: 'd6',  icon: '🥗', name: 'Gesunde Mahlzeit',            xpKey: 'daily_medium' },
  { id: 'd7',  icon: '📝', name: 'Tagebuch schreiben',          xpKey: 'daily_medium' },
  { id: 'd8',  icon: '🏋️', name: '30 Min Sport',                xpKey: 'daily_hard'   },
  { id: 'd9',  icon: '🧹', name: 'Wohnung aufräumen',           xpKey: 'daily_hard'   },
  { id: 'd10', icon: '🎯', name: '1h fokussiert arbeiten',      xpKey: 'daily_hard'   },
  { id: 'd11', icon: '🌿', name: 'Spaziergang 30 Min',          xpKey: 'daily_easy'   },
  { id: 'd12', icon: '📵', name: '2h kein Smartphone',          xpKey: 'daily_medium' },
  { id: 'd13', icon: '🌞', name: 'Früh aufstehen (vor 8 Uhr)', xpKey: 'daily_easy'   },
  { id: 'd14', icon: '🍎', name: 'Kein Junkfood heute',         xpKey: 'daily_medium' },
  { id: 'd15', icon: '🧗', name: '45 Min Outdoor-Aktivität',   xpKey: 'daily_hard'   },
  { id: 'd16', icon: '📞', name: 'Freund/Familie anrufen',      xpKey: 'daily_easy'   },
  { id: 'd17', icon: '☕', name: 'Ohne Snooze aufstehen',       xpKey: 'daily_easy'   },
  { id: 'd18', icon: '🎵', name: '30 Min Musik machen/lernen', xpKey: 'daily_medium' },
  { id: 'd19', icon: '💻', name: '2h produktiv am Projekt',    xpKey: 'daily_hard'   },
  { id: 'd20', icon: '🧃', name: 'Gesund frühstücken',          xpKey: 'daily_easy'   },
  { id: 'd21', icon: '🫁', name: '10 Min Atemübungen',          xpKey: 'daily_easy'   },
  { id: 'd22', icon: '📊', name: 'Tagesplanung erstellen',      xpKey: 'daily_medium' },
  { id: 'd23', icon: '🦷', name: 'Oral-Care Routine',           xpKey: 'daily_easy'   },
  { id: 'd24', icon: '🌙', name: 'Digital Detox Abend',         xpKey: 'daily_hard'   },
  { id: 'd25', icon: '💪', name: '100 Liegestütze gesamt',      xpKey: 'daily_hard'   },
];

/* ── DAILY LOGIN REWARDS ─────────────────────────────────────── */
const DAILY_LOGIN_REWARDS = [
  { day: 1, icon: '⚡', label: '+100 XP',           type: 'xp',          value: 100  },
  { day: 2, icon: '📦', label: 'Basic Box',          type: 'loot',        value: 'basic' },
  { day: 3, icon: '⚡', label: '+200 XP',           type: 'xp',          value: 200  },
  { day: 4, icon: '⚡', label: '+300 XP',           type: 'xp',          value: 300  },
  { day: 5, icon: '🎁', label: 'Advanced Box',       type: 'loot',        value: 'advanced' },
  { day: 6, icon: '⚡', label: '+400 XP',           type: 'xp',          value: 400  },
  { day: 7, icon: '💠', label: 'Elite Box + 1 SP',   type: 'loot_sp',     value: { loot: 'elite',   sp: 1 } },
];

/* ── COSMETICS ─────────────────────────────────────────────────
   Two categories only:
   type: 'bg'  → Background cosmetics (15)
   type: 'ui'  → UI cosmetics: XP bar, cards, buttons (15)

   source:  'free'    = earned via gameplay
            'gems'    = bought with Gems in shop
   cost:    gem price (0 if free)
   quality: 'standard' | 'high' | 'premium'
──────────────────────────────────────────────────────────────── */
const COSMETICS = [

  // ══ BACKGROUNDS (15) ══════════════════════════════════════════

  { id: 'bg-default',    type: 'bg', icon: '⬛', name: 'Void',
    desc: 'Tiefschwarz. Der Anfang.', cssClass: '',
    source: 'free', cost: 0, quality: 'standard',
    unlockCondition: 'Standard', unlocked: true },

  { id: 'bg-grid',       type: 'bg', icon: '⊞', name: 'Cyber Grid',
    desc: 'Cyan-Gitter auf Schwarz.', cssClass: 'bg-grid',
    source: 'free', cost: 0, quality: 'standard',
    unlockCondition: 'Level 15', unlocked: false },

  { id: 'bg-matrix',     type: 'bg', icon: '🟩', name: 'Matrix',
    desc: 'Fallende grüne Zeichen.', cssClass: 'bg-matrix',
    source: 'gems', cost: 80, quality: 'high',
    unlockCondition: '80 💎', unlocked: false },

  { id: 'bg-aurora',     type: 'bg', icon: '🌌', name: 'Aurora',
    desc: 'Nordlichter in Blau und Lila.', cssClass: 'bg-aurora',
    source: 'gems', cost: 120, quality: 'high',
    unlockCondition: '120 💎', unlocked: false },

  { id: 'bg-ember',      type: 'bg', icon: '🔥', name: 'Ember',
    desc: 'Glühende Asche und Lava-Risse.', cssClass: 'bg-ember',
    source: 'gems', cost: 100, quality: 'high',
    unlockCondition: '100 💎', unlocked: false },

  { id: 'bg-ocean',      type: 'bg', icon: '🌊', name: 'Deep Ocean',
    desc: 'Tiefsee-Biolumineszenz.', cssClass: 'bg-ocean',
    source: 'gems', cost: 90, quality: 'high',
    unlockCondition: '90 💎', unlocked: false },

  { id: 'bg-galaxy',     type: 'bg', icon: '🌠', name: 'Galaxy',
    desc: 'Sternennebel und Galaxien.', cssClass: 'bg-galaxy',
    source: 'gems', cost: 150, quality: 'premium',
    unlockCondition: '150 💎', unlocked: false },

  { id: 'bg-neon-city',  type: 'bg', icon: '🏙️', name: 'Neon City',
    desc: 'Cyberpunk Skyline bei Nacht.', cssClass: 'bg-neon-city',
    source: 'gems', cost: 200, quality: 'premium',
    unlockCondition: '200 💎', unlocked: false },

  { id: 'bg-storm',      type: 'bg', icon: '⛈️', name: 'Storm',
    desc: 'Blitze und dunkle Wolken.', cssClass: 'bg-storm',
    source: 'gems', cost: 110, quality: 'high',
    unlockCondition: '110 💎', unlocked: false },

  { id: 'bg-gold',       type: 'bg', icon: '🟡', name: 'Golden Age',
    desc: 'Goldstaub und Lichtreflexe.', cssClass: 'bg-gold',
    source: 'free', cost: 0, quality: 'high',
    unlockCondition: 'Level 50', unlocked: false },

  { id: 'bg-void-purple',type: 'bg', icon: '🟣', name: 'Void Purple',
    desc: 'Lila Nebel im Nichts.', cssClass: 'bg-void-purple',
    source: 'gems', cost: 80, quality: 'standard',
    unlockCondition: '80 💎', unlocked: false },

  { id: 'bg-ice',        type: 'bg', icon: '🧊', name: 'Frozen',
    desc: 'Eis-Kristalle und Frost.', cssClass: 'bg-ice',
    source: 'gems', cost: 90, quality: 'high',
    unlockCondition: '90 💎', unlocked: false },

  { id: 'bg-sakura',     type: 'bg', icon: '🌸', name: 'Sakura',
    desc: 'Fallende Kirschblüten.', cssClass: 'bg-sakura',
    source: 'gems', cost: 130, quality: 'high',
    unlockCondition: '130 💎', unlocked: false },

  { id: 'bg-blood',      type: 'bg', icon: '🩸', name: 'Blood Moon',
    desc: 'Roter Himmel. Blutmond.', cssClass: 'bg-blood',
    source: 'gems', cost: 180, quality: 'premium',
    unlockCondition: '180 💎', unlocked: false },

  { id: 'bg-nexus-core', type: 'bg', icon: '⚡', name: 'Nexus Core',
    desc: 'Cyan-Energie im Kern.', cssClass: 'bg-nexus-core',
    source: 'free', cost: 0, quality: 'premium',
    unlockCondition: '1000 Quests', unlocked: false },

  // ══ UI COSMETICS (15) ═════════════════════════════════════════

  { id: 'ui-default',    type: 'ui', icon: '🌊', name: 'Nexus Standard',
    desc: 'Der klassische Cyan-Look.', cssClass: '',
    source: 'free', cost: 0, quality: 'standard',
    unlockCondition: 'Standard', unlocked: true },

  { id: 'ui-golden',     type: 'ui', icon: '🌅', name: 'Golden Dawn',
    desc: 'XP-Bar und Highlights in Gold.', cssClass: 'ui-golden',
    source: 'free', cost: 0, quality: 'standard',
    unlockCondition: 'Level 10', unlocked: false },

  { id: 'ui-dark-matter',type: 'ui', icon: '🌑', name: 'Dark Matter',
    desc: 'Grau-weißes minimalistisches UI.', cssClass: 'ui-dark-matter',
    source: 'free', cost: 0, quality: 'standard',
    unlockCondition: 'Level 25', unlocked: false },

  { id: 'ui-plasma',     type: 'ui', icon: '💜', name: 'Plasma',
    desc: 'Lila-pinkes UI.', cssClass: 'ui-plasma',
    source: 'free', cost: 0, quality: 'standard',
    unlockCondition: '10.000 XP', unlocked: false },

  { id: 'ui-blood-red',  type: 'ui', icon: '🔴', name: 'Blood Red',
    desc: 'Knallrotes UI — kein Erbarmen.', cssClass: 'ui-blood-red',
    source: 'gems', cost: 60, quality: 'standard',
    unlockCondition: '60 💎', unlocked: false },

  { id: 'ui-neon-green', type: 'ui', icon: '🟢', name: 'Neon Green',
    desc: 'Matrix-grünes Hacker-UI.', cssClass: 'ui-neon-green',
    source: 'gems', cost: 60, quality: 'standard',
    unlockCondition: '60 💎', unlocked: false },

  { id: 'ui-amber',      type: 'ui', icon: '🟠', name: 'Amber',
    desc: 'Warmes Orange-Gelb.', cssClass: 'ui-amber',
    source: 'gems', cost: 70, quality: 'standard',
    unlockCondition: '70 💎', unlocked: false },

  { id: 'ui-ice-blue',   type: 'ui', icon: '🔵', name: 'Ice Blue',
    desc: 'Eiskaltes Blau.', cssClass: 'ui-ice-blue',
    source: 'gems', cost: 70, quality: 'standard',
    unlockCondition: '70 💎', unlocked: false },

  { id: 'ui-rose',       type: 'ui', icon: '🌹', name: 'Rose Gold',
    desc: 'Elegantes Rosé-Gold.', cssClass: 'ui-rose',
    source: 'gems', cost: 90, quality: 'high',
    unlockCondition: '90 💎', unlocked: false },

  { id: 'ui-toxic',      type: 'ui', icon: '☢️', name: 'Toxic',
    desc: 'Giftgrün und gefährlich.', cssClass: 'ui-toxic',
    source: 'gems', cost: 80, quality: 'high',
    unlockCondition: '80 💎', unlocked: false },

  { id: 'ui-hologram',   type: 'ui', icon: '🔷', name: 'Hologram',
    desc: 'Holografischer Regenbogen-Schimmer.', cssClass: 'ui-hologram',
    source: 'gems', cost: 150, quality: 'premium',
    unlockCondition: '150 💎', unlocked: false },

  { id: 'ui-inferno',    type: 'ui', icon: '🌋', name: 'Inferno',
    desc: 'Feuer-Gradient — Orange zu Rot.', cssClass: 'ui-inferno',
    source: 'gems', cost: 120, quality: 'high',
    unlockCondition: '120 💎', unlocked: false },

  { id: 'ui-midnight',   type: 'ui', icon: '🌙', name: 'Midnight',
    desc: 'Tiefblaues Nacht-UI.', cssClass: 'ui-midnight',
    source: 'gems', cost: 100, quality: 'high',
    unlockCondition: '100 💎', unlocked: false },

  { id: 'ui-galaxy-pro', type: 'ui', icon: '✨', name: 'Galaxy Pro',
    desc: 'Sternstaub-Effekt auf UI-Elementen.', cssClass: 'ui-galaxy-pro',
    source: 'gems', cost: 200, quality: 'premium',
    unlockCondition: '200 💎', unlocked: false },

  { id: 'ui-nexus-prime',type: 'ui', icon: '⭐', name: 'Nexus Prime',
    desc: 'Das ultimative Nexus-UI.', cssClass: 'ui-nexus-prime',
    source: 'free', cost: 0, quality: 'premium',
    unlockCondition: 'Level 100', unlocked: false },
];

/* ── SKILLS (stripped — SkillTree removed as per spec) ───────── */
const SKILLS = [];
const SKILL_CATEGORIES = {};

function getSkill(id) { return null; }

/* ── CARD DROP (disabled — cards only from lootboxes) ─────────── */
const CARD_DROP_CHANCE = 0;
const CARD_DROP_POOL   = [];
const LOOT_FROM_TASKS  = false;
