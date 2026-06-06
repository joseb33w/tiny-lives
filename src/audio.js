export class Ambient {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this._birdTimer = null;
    this.started = false;
  }

  start() {
    if (this.started) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.started = true;
    const ctx = new AC();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 2.5);
    this.master = master;

    // warm pad chord
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.Q.value = 0.6;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.5;
    filter.connect(padGain);
    padGain.connect(master);

    const freqs = [130.8, 196.0, 261.6, 329.6]; // C3 G3 C4 E4
    for (const f of freqs) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.detune.value = (Math.random() - 0.5) * 8;
      const g = ctx.createGain();
      g.gain.value = 0.16;
      o.connect(g); g.connect(filter);
      o.start();
    }
    // breathing LFO on the filter
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 240;
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
    lfo.start();

    this._scheduleBird();
  }

  _scheduleBird() {
    const next = 5000 + Math.random() * 9000;
    this._birdTimer = setTimeout(() => {
      this._chirp();
      this._scheduleBird();
    }, next);
  }

  _chirp() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const notes = 2 + ((Math.random() * 2) | 0);
    const base = 1900 + Math.random() * 700;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(this.master);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.connect(g);
    for (let i = 0; i < notes; i++) {
      const ts = t + i * 0.12;
      o.frequency.setValueAtTime(base * (1 + i * 0.08), ts);
      g.gain.setValueAtTime(0, ts);
      g.gain.linearRampToValueAtTime(0.08, ts + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0008, ts + 0.1);
    }
    o.start(t);
    o.stop(t + notes * 0.12 + 0.1);
  }

  setMuted(m) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.linearRampToValueAtTime(m ? 0 : 0.16, this.ctx.currentTime + 0.3);
    }
  }
}
