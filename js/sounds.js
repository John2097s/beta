'use strict';

/**
 * NEXUS Sound System — Web Audio API, no external files.
 * All sounds generated programmatically.
 * Respects user preference (can be muted via Settings).
 */
const Sound = {
  _ctx: null,
  _muted: false,
  _vol: 0.25,   // master volume — keep subtle by default

  _ctx_get() {
    if (!this._ctx) {
      try {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) { return null; }
    }
    // Resume context on user gesture
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  },

  toggle() {
    this._muted = !this._muted;
    if (typeof state !== 'undefined') {
      state.soundMuted = this._muted;
      saveState?.();
    }
    return this._muted;
  },

  init() {
    if (typeof state !== 'undefined' && state.soundMuted !== undefined) {
      this._muted = !!state.soundMuted;
    }
  },

  /* ── Core tone generator ──────────────────────────────────── */
  _tone(freq, type, dur, vol, delay = 0, decay = 'exp') {
    if (this._muted) return;
    const ctx = this._ctx_get();
    if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type      = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(Math.min(vol * this._vol, 1), ctx.currentTime + delay);
    if (decay === 'exp') {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    } else {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + dur);
    }
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur + 0.01);
  },

  _noise(dur, vol, delay = 0) {
    if (this._muted) return;
    const ctx = this._ctx_get();
    if (!ctx) return;
    const len    = ctx.sampleRate * dur;
    const buf    = ctx.createBuffer(1, len, ctx.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const src    = ctx.createBufferSource();
    const gain   = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    src.buffer = buf;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    gain.gain.setValueAtTime(vol * this._vol, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    src.start(ctx.currentTime + delay);
    src.stop(ctx.currentTime + delay + dur + 0.05);
  },

  /* ── GAME SOUNDS ──────────────────────────────────────────── */

  /** Task completed — upbeat positive chord */
  taskDone() {
    this._tone(523, 'sine', 0.12, 0.5);           // C5
    this._tone(659, 'sine', 0.12, 0.45, 0.06);    // E5
    this._tone(784, 'sine', 0.18, 0.4,  0.12);    // G5
    this._tone(1046,'sine', 0.22, 0.35, 0.20);    // C6
  },

  /** Level up — triumphant fanfare */
  levelUp() {
    const notes = [523, 659, 784, 1046, 1318];
    notes.forEach((f, i) => this._tone(f, 'triangle', 0.25, 0.5, i * 0.08));
    // sparkle on top
    this._tone(2093, 'sine', 0.15, 0.3, 0.45);
    this._tone(2637, 'sine', 0.12, 0.25, 0.55);
  },

  /** Achievement unlock — magical shimmer */
  achievement() {
    this._tone(880,  'sine', 0.2,  0.45);
    this._tone(1108, 'sine', 0.18, 0.4,  0.05);
    this._tone(1320, 'sine', 0.22, 0.5,  0.10);
    this._tone(1760, 'sine', 0.16, 0.4,  0.18);
    this._noise(0.1, 0.2, 0.15);
  },

  /** Card used — swoosh */
  cardUse() {
    this._tone(300, 'sawtooth', 0.12, 0.35);
    const ctx = this._ctx_get();
    if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3 * this._vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.16);
  },

  /** Lootbox open — epic reveal */
  lootboxOpen() {
    // Low rumble
    this._tone(60, 'sawtooth', 0.4, 0.5);
    this._tone(80, 'square',   0.35, 0.45, 0.05);
    // Rising sweep
    const ctx = this._ctx_get();
    if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.4 * this._vol, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc.start(ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.6);
  },

  /** Card reveal — rarity-dependent */
  cardReveal(rarity = 'common') {
    const pitches = {
      common:    [523, 659],
      rare:      [659, 784, 988],
      epic:      [784, 988, 1318, 1568],
      legendary: [880, 1108, 1319, 1760, 2093],
      mythic:    [523, 784, 1046, 1568, 2093, 2637],
    };
    const notes = pitches[rarity] || pitches.common;
    notes.forEach((f, i) => {
      this._tone(f, rarity === 'mythic' ? 'triangle' : 'sine', 0.22, 0.45 - i * 0.04, i * 0.07);
    });
    if (rarity === 'legendary' || rarity === 'mythic') {
      this._noise(0.15, 0.3, 0.3);
    }
  },

  /** Button tap — subtle click */
  tap() {
    this._tone(800, 'sine', 0.04, 0.2);
  },

  /** Navigation tab switch */
  navSwitch() {
    this._tone(440, 'sine', 0.06, 0.15);
    this._tone(554, 'sine', 0.06, 0.12, 0.04);
  },

  /** Daily task complete — lighter version */
  dailyDone() {
    this._tone(659, 'sine', 0.1,  0.4);
    this._tone(880, 'sine', 0.14, 0.35, 0.08);
  },

  /** Coin earned */
  coin() {
    this._tone(1046, 'triangle', 0.08, 0.35);
    this._tone(1319, 'triangle', 0.07, 0.3, 0.05);
  },

  /** Error / danger */
  error() {
    this._tone(200, 'square', 0.15, 0.4);
    this._tone(150, 'square', 0.12, 0.35, 0.1);
  },

  /** Sell card */
  sell() {
    this._tone(784,  'sine', 0.08, 0.35);
    this._tone(1046, 'sine', 0.1,  0.4, 0.06);
    this._tone(1318, 'sine', 0.08, 0.3, 0.12);
  },
};
