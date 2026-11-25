// WARUNG KILAT — synthesized sound effects (WebAudio, no audio files).
// Every sound is built from oscillators and filtered noise at play time,
// so the game ships no audio assets and loads nothing over the network.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sizzleGain = null;
    this.sizzleSrc = null;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
      } catch (err) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  tone(freq, durMs, type = 'sine', vol = 0.16, delayMs = 0, slideTo = 0) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + delayMs / 1000;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + durMs / 1000);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + durMs / 1000);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + durMs / 1000 + 0.02);
    } catch (err) {
      /* audio is decoration; never break the game */
    }
  }

  noiseBurst(durMs, vol = 0.2, filterFreq = 1800) {
    if (!this.ctx || this.muted) return;
    try {
      const len = Math.max(1, Math.floor((this.ctx.sampleRate * durMs) / 1000));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;
      const gain = this.ctx.createGain();
      gain.gain.value = vol;
      src.connect(filter).connect(gain).connect(this.ctx.destination);
      src.start();
    } catch (err) {
      /* ignore */
    }
  }

  chop() {
    this.noiseBurst(90, 0.3, 2400);
    this.tone(190, 70, 'triangle', 0.14, 0, 90);
  }

  toss() {
    this.noiseBurst(160, 0.16, 900);
    this.tone(320, 120, 'sine', 0.1, 0, 520);
  }

  ding() {
    this.tone(880, 180, 'sine', 0.16);
    this.tone(1318, 260, 'sine', 0.12, 90);
  }

  coin() {
    this.tone(988, 110, 'square', 0.07);
    this.tone(1319, 200, 'square', 0.07, 90);
  }

  error() {
    this.tone(140, 220, 'sawtooth', 0.12, 0, 90);
  }

  tick() {
    this.tone(1200, 50, 'square', 0.05);
  }

  serve() {
    this.tone(523, 120, 'triangle', 0.14);
    this.tone(659, 120, 'triangle', 0.14, 100);
    this.tone(784, 240, 'triangle', 0.16, 200);
  }

  sizzleStart() {
    if (!this.ctx || this.muted || this.sizzleSrc) return;
    try {
      const len = this.ctx.sampleRate * 1;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.045;
      src.connect(filter).connect(gain).connect(this.ctx.destination);
      src.start();
      this.sizzleSrc = src;
      this.sizzleGain = gain;
    } catch (err) {
      /* ignore */
    }
  }

  sizzleStop() {
    if (this.sizzleSrc) {
      try {
        this.sizzleSrc.stop();
      } catch (err) {
        /* ignore */
      }
      this.sizzleSrc = null;
      this.sizzleGain = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (muted) this.sizzleStop();
  }
}
