// WARUNG KILAT — Midnight Wok Rush. Boot, game loop, state machine.
// One shift lasts 150 seconds: tickets arrive on the order board, the
// player builds each dish as a chain (pick -> chop on a timing bar ->
// wok with burn risk -> plate -> serve), and perfect chains build a
// combo multiplier. The shift ends when the timer runs out.

import { INGREDIENTS, DISHES, dishById, makeRng } from './recipes.js';
import { TimingBar } from './timing.js';
import { SoundBank } from './audio.js';
import { OrderBoard } from './orders.js';
import {
  LAYOUT, W, H, drawBackground, drawStations,
  drawAssemblyStrip, drawIngredientCounter,
} from './kitchen.js';
import { roundRect, circle } from './art.js';
import { attachInput } from './input.js';

const SHIFT_MS = 150000;
const TARGET_COINS = 120;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sound = new SoundBank();
    this.ingredientIds = INGREDIENTS.map((ing) => ing.id);
    const params = new URLSearchParams(window.location.search);
    this.seed = Number(params.get('seed') || 20261125);
    this.shot = params.get('shot') || '';
    this.rng = makeRng(this.seed);
    this.orders = new OrderBoard(this.rng);
    this.timingBar = new TimingBar(1.15);
    this.hover = null;
    this.phase = 'title';
    this.elapsedMs = 0;
    this.timeLeftMs = SHIFT_MS;
    this.score = 0;
    this.coins = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.served = 0;
    this.perfectServes = 0;
    this.burntCount = 0;
    this.current = null;
    this.toasts = [];
    this.shakeUntil = 0;
    this.lastTickSecond = -1;
    this.tossCount = 0;
    this.startedAt = 0;
    if (this.shot) this.setupShot(this.shot);
  }

  // ---- flow ----
  start() {
    this.startedAt = performance.now();
    const loop = (now) => {
      const dtMs = Math.min(50, now - (this.lastNow || now));
      this.lastNow = now;
      this.update(dtMs, now / 1000);
      this.render(now / 1000);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  startShift() {
    this.phase = 'playing';
    this.elapsedMs = 0;
    this.timeLeftMs = SHIFT_MS;
    this.score = 0;
    this.coins = 0;
    this.combo = 0;
    this.served = 0;
    this.perfectServes = 0;
    this.burntCount = 0;
    this.current = null;
    this.orders.reset();
    this.toasts = [];
    this.sound.ensure();
    this.addToast('Shift dimulai! Sajikan 120 koin untuk menang.', '#ffd23e');
  }

  endShift() {
    this.phase = 'over';
    this.current = null;
    this.sound.sizzleStop();
    this.sound.serve();
  }

  restart() {
    this.rng = makeRng(this.seed + Math.floor(Math.random() * 100000));
    this.orders = new OrderBoard(this.rng);
    this.startShift();
  }

  // ---- dish chain ----
  startDish(dishId) {
    this.current = {
      dishId,
      stepIndex: 0,
      choppedCount: 0,
      chops: [],
      stage: 'pick',
      boardIngredient: null,
      cookProgress: 0,
      burnProgress: 0,
      burnt: false,
      perfectDish: false,
    };
    this.tossCount = 0;
  }

  pickIngredient(id) {
    if (this.phase !== 'playing' || !id) return;
    if (!this.current) {
      const dish = DISHES.find((d) => d.ingredients[0] === id);
      if (!dish) {
        this.sound.error();
        this.addToast('Mulai dari bahan pertama sebuah resep.', '#ff8a7a');
        return;
      }
      this.startDish(dish.id);
    }
    const cur = this.current;
    if (cur.stage !== 'pick') return;
    const dish = dishById(cur.dishId);
    const expected = dish.ingredients[cur.stepIndex];
    if (id !== expected) {
      this.sound.error();
      this.shakeUntil = performance.now() + 180;
      this.addToast(`Urutan salah! Berikutnya: ${this.ingredientName(expected)}.`, '#ff8a7a');
      return;
    }
    cur.boardIngredient = id;
    cur.stage = 'chop';
    this.timingBar.start();
    this.sound.tone(440, 60, 'triangle', 0.1);
  }

  ingredientName(id) {
    const found = INGREDIENTS.find((ing) => ing.id === id);
    return found ? found.name : id;
  }

  chopAction() {
    if (this.phase !== 'playing' || !this.current) return;
    const cur = this.current;
    if (cur.stage !== 'chop') return;
    const result = this.timingBar.evaluate();
    this.timingBar.stop();
    cur.chops.push(result);
    this.sound.chop();
    if (result === 'perfect') {
      this.addToast('Cincangan PERFECT!', '#7de38a');
    } else if (result === 'poor') {
      this.addToast('Cincangan kurang rapi…', '#e8a13c');
    }
    cur.choppedCount += 1;
    cur.stepIndex += 1;
    cur.boardIngredient = null;
    const dish = dishById(cur.dishId);
    if (cur.stepIndex >= dish.ingredients.length) {
      cur.stage = 'cook';
      cur.cookProgress = 0;
      this.sound.sizzleStart();
      this.sound.toss();
    } else {
      cur.stage = 'pick';
    }
  }

  tossAction() {
    const cur = this.current;
    if (this.phase !== 'playing' || !cur || cur.stage !== 'cook' || cur.burnt) return;
    if (this.tossCount < 3) {
      this.tossCount += 1;
      this.coins += 1;
      this.score += 10;
      this.sound.toss();
      this.addToast('Aduk cantik! +1 koin', '#7de38a');
    }
  }

  plateDish() {
    const cur = this.current;
    if (this.phase !== 'playing' || !cur || cur.stage !== 'cook') return;
    if (cur.cookProgress < 1) {
      this.sound.error();
      this.addToast('Belum matang — tunggu wajan selesai.', '#ff8a7a');
      return;
    }
    if (cur.burnt) {
      this.sound.error();
      this.addToast('Gosong! Buang dan mulai lagi.', '#ff8a7a');
      this.discardDish();
      return;
    }
    cur.stage = 'plated';
    cur.perfectDish = cur.chops.length > 0 && cur.chops.every((c) => c === 'perfect');
    this.sound.sizzleStop();
    this.sound.ding();
  }

  serveDish() {
    const cur = this.current;
    if (this.phase !== 'playing' || !cur || cur.stage !== 'plated') return;
    const ticket = this.orders.serve(cur.dishId);
    if (!ticket) {
      this.sound.error();
      this.addToast(`Tidak ada pesanan ${dishById(cur.dishId).short} saat ini.`, '#ff8a7a');
      return;
    }
    const mult = Math.min(2, 1 + 0.25 * this.combo);
    const earned = Math.round(ticket.reward * (cur.perfectDish ? 1.5 : 1) * mult);
    this.coins += earned;
    this.score += earned * 10 + (cur.perfectDish ? 50 : 0);
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.served += 1;
    if (cur.perfectDish) this.perfectServes += 1;
    this.sound.coin();
    this.sound.serve();
    this.addToast(
      `Tersaji! +${earned} koin${cur.perfectDish ? ' (PERFECT)' : ''} — combo x${this.combo}`,
      '#ffd23e',
    );
    this.current = null;
  }

  discardDish() {
    if (this.phase !== 'playing' || !this.current) return;
    if (this.current.burnt) this.burntCount += 1;
    this.current = null;
    this.timingBar.stop();
    this.sound.sizzleStop();
  }

  primaryAction() {
    if (this.phase === 'title') {
      this.startShift();
      return;
    }
    if (this.phase === 'over') {
      this.restart();
      return;
    }
    const cur = this.current;
    if (!cur) return;
    if (cur.stage === 'chop') this.chopAction();
    else if (cur.stage === 'cook') this.tossAction();
  }

  toggleMute() {
    this.sound.setMuted(!this.sound.muted);
    this.addToast(this.sound.muted ? 'Suara mati.' : 'Suara hidup.', '#9fb4b8');
  }

  // ---- clicks ----
  handleClick(x, y) {
    if (this.phase === 'title') {
      if (this.inRect(x, y, LAYOUT.startBtn)) this.startShift();
      return;
    }
    if (this.phase === 'over') {
      if (this.inRect(x, y, LAYOUT.restartBtn)) this.restart();
      return;
    }
    if (this.inRect(x, y, LAYOUT.muteBtn)) {
      this.toggleMute();
      return;
    }
    const cur = this.current;
    if (cur && cur.stage === 'chop' && this.inRect(x, y, LAYOUT.board)) {
      this.chopAction();
      return;
    }
    if (this.inRect(x, y, LAYOUT.serveBtn)) {
      this.serveDish();
      return;
    }
    const dx = x - LAYOUT.plate.x;
    const dy = y - LAYOUT.plate.y;
    if (dx * dx + dy * dy <= LAYOUT.plate.r * LAYOUT.plate.r) {
      this.plateDish();
      return;
    }
    if (cur && cur.stage === 'cook' && this.inRect(x, y, LAYOUT.wok)) {
      this.tossAction();
      return;
    }
    for (let i = 0; i < LAYOUT.tickets.length; i++) {
      if (this.inRect(x, y, LAYOUT.tickets[i]) && cur && cur.stage === 'plated') {
        this.serveDish();
        return;
      }
    }
    for (const slot of LAYOUT.ingredients) {
      if (this.inRect(x, y, slot)) {
        this.pickIngredient(slot.id);
        return;
      }
    }
  }

  inRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  addToast(text, color) {
    this.toasts.push({ text, color, until: performance.now() + 2600 });
    if (this.toasts.length > 3) this.toasts.shift();
  }

  // ---- update ----
  update(dtMs, t) {
    if (this.phase !== 'playing') return;
    this.elapsedMs += dtMs;
    this.timeLeftMs = Math.max(0, SHIFT_MS - this.elapsedMs);
    const expired = this.orders.update(dtMs, this.elapsedMs);
    for (const ticket of expired) {
      this.combo = 0;
      this.sound.error();
      this.addToast(`Pesanan ${dishById(ticket.dishId).short} kabur! Combo reset.`, '#ff8a7a');
    }
    this.timingBar.update(dtMs / 1000);
    const cur = this.current;
    if (cur && cur.stage === 'cook') {
      const dish = dishById(cur.dishId);
      cur.cookProgress += dtMs / dish.cookMs;
      if (cur.cookProgress >= 1) {
        cur.burnProgress += dtMs / 2600;
        if (cur.burnProgress >= 1 && !cur.burnt) {
          cur.burnt = true;
          this.sound.sizzleStop();
          this.sound.error();
          this.addToast('GOSONG! Hidangan hangus.', '#ff8a7a');
        }
      }
    }
    const secondsLeft = Math.ceil(this.timeLeftMs / 1000);
    if (secondsLeft <= 10 && secondsLeft !== this.lastTickSecond && this.timeLeftMs > 0) {
      this.lastTickSecond = secondsLeft;
      this.sound.tick();
    }
    this.toasts = this.toasts.filter((toast) => toast.until > performance.now());
    if (this.timeLeftMs <= 0) this.endShift();
  }

  // ---- render ----
  render(t) {
    const ctx = this.ctx;
    ctx.save();
    if (performance.now() < this.shakeUntil) {
      ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    }
    drawBackground(ctx, t);
    const highlight = this.current && this.current.stage === 'plated'
      ? this.current.dishId : null;
    this.orders.draw(ctx, t, highlight);
    drawStations(ctx, this, t);
    drawAssemblyStrip(ctx, this);
    drawIngredientCounter(ctx, this, t);
    this.drawHeader(ctx, t);
    this.drawToasts(ctx);
    if (this.phase === 'title') this.drawTitle(ctx, t);
    if (this.phase === 'over') this.drawGameOver(ctx);
    ctx.restore();
  }

  drawHeader(ctx, t) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 20, 24, 0.72)';
    ctx.fillRect(0, 0, W, 54);
    // Title.
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('WARUNG KILAT', 16, 28);
    ctx.fillStyle = '#9fb4b8';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('Midnight Wok Rush', 200, 30);
    // Shift timer (centre).
    const seconds = Math.ceil(this.timeLeftMs / 1000);
    const mm = String(Math.floor(seconds / 60)).padStart(1, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    const urgent = this.phase === 'playing' && seconds <= 30;
    ctx.fillStyle = urgent ? '#ff8a7a' : '#f5efe0';
    ctx.font = `bold ${urgent ? 32 : 28}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`${mm}:${ss}`, 640, 28 + (urgent ? Math.sin(t * 6) * 1.5 : 0));
    ctx.fillStyle = '#9fb4b8';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('SHIFT', 640, 46);
    // Coins + score (right).
    ctx.fillStyle = '#ffd23e';
    circle(ctx, 880, 27, 11);
    ctx.fill();
    ctx.fillStyle = '#7a4a21';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('C', 880, 31);
    ctx.fillStyle = '#f5efe0';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.coins}`, 900, 28);
    ctx.fillStyle = '#9fb4b8';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`/ ${TARGET_COINS}`, 900 + ctx.measureText(`${this.coins}`).width + 6, 30);
    ctx.fillStyle = '#f5efe0';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(`SKOR ${this.score}`, 980, 28);
    if (this.combo >= 2) {
      ctx.fillStyle = '#ff7a1a';
      ctx.font = 'bold 17px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`COMBO x${this.combo}`, 1198, 28);
      ctx.textAlign = 'left';
    }
    // Mute button.
    ctx.fillStyle = '#24363c';
    roundRect(ctx, LAYOUT.muteBtn.x, LAYOUT.muteBtn.y, LAYOUT.muteBtn.w, LAYOUT.muteBtn.h, 6);
    ctx.fill();
    ctx.fillStyle = '#f5efe0';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.sound.muted ? 'MUTE' : 'SUARA', LAYOUT.muteBtn.x + 27, LAYOUT.muteBtn.y + 23);
    ctx.restore();
  }

  drawToasts(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    let y = 446;
    for (const toast of this.toasts.slice(-3)) {
      ctx.font = 'bold 16px system-ui, sans-serif';
      const w = ctx.measureText(toast.text).width + 28;
      ctx.fillStyle = 'rgba(10, 20, 24, 0.85)';
      roundRect(ctx, 640 - w / 2, y - 20, w, 28, 14);
      ctx.fill();
      ctx.fillStyle = toast.color;
      ctx.fillText(toast.text, 640, y);
      y -= 34;
    }
    ctx.restore();
  }

  drawTitle(ctx, t) {
    ctx.save();
    ctx.fillStyle = 'rgba(8, 16, 20, 0.66)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.fillText('WARUNG KILAT', 640, 250);
    ctx.fillStyle = '#f5efe0';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText('— Midnight Wok Rush —', 640, 300);
    ctx.fillStyle = '#cfe0d8';
    ctx.font = '19px system-ui, sans-serif';
    ctx.fillText('Bangun hidangan dari rantai resep, cincang tepat waktu,', 640, 360);
    ctx.fillText('jangan sampai gosong, dan sajikan sebelum pelanggan kabur.', 640, 388);
    ctx.fillStyle = '#9fb4b8';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Klik bahan (1–8) • Spasi: cincang / aduk • P: plating • S: sajikan • X: buang', 640, 430);
    ctx.fillText('Target: 120 koin dalam 150 detik. 5 resep, 8 bahan, combo perfect.', 640, 458);
    const pulse = 0.75 + 0.25 * Math.sin(t * 4);
    ctx.fillStyle = `rgba(232, 161, 60, ${pulse})`;
    roundRect(ctx, LAYOUT.startBtn.x, LAYOUT.startBtn.y, LAYOUT.startBtn.w, LAYOUT.startBtn.h, 12);
    ctx.fill();
    ctx.fillStyle = '#241a05';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('MULAI SHIFT  ▶', 640, LAYOUT.startBtn.y + 42);
    ctx.restore();
  }

  drawGameOver(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(8, 16, 20, 0.78)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    const won = this.coins >= TARGET_COINS;
    const stars = this.coins >= 180 ? 3 : this.coins >= 120 ? 2 : this.coins >= 60 ? 1 : 0;
    ctx.fillStyle = won ? '#ffd23e' : '#f5efe0';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.fillText(won ? 'SHIFT BERHASIL!' : 'SHIFT SELESAI', 640, 220);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), 640, 285);
    ctx.fillStyle = '#f5efe0';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText(`Koin: ${this.coins} / ${TARGET_COINS}   •   Skor: ${this.score}`, 640, 340);
    ctx.fillText(
      `Hidangan tersaji: ${this.served}   •   Perfect: ${this.perfectServes}   •   Combo terbaik: x${this.bestCombo}   •   Gosong: ${this.burntCount}`,
      640, 378,
    );
    ctx.fillStyle = '#9fb4b8';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Tekan Enter atau klik tombol di bawah untuk main lagi.', 640, 420);
    ctx.fillStyle = '#e8a13c';
    roundRect(ctx, LAYOUT.restartBtn.x, LAYOUT.restartBtn.y, LAYOUT.restartBtn.w, LAYOUT.restartBtn.h, 12);
    ctx.fill();
    ctx.fillStyle = '#241a05';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('MAIN LAGI  ↻', 640, LAYOUT.restartBtn.y + 41);
    ctx.restore();
  }

  // ---- deterministic screenshot states ----
  setupShot(name) {
    this.phase = 'playing';
    const rng = makeRng(this.seed);
    if (name === 'start') {
      this.phase = 'title';
      this.orders = new OrderBoard(rng);
      this.orders.tickets = [
        { id: 901, dishId: 'nasi-goreng', patienceMs: 30000, maxPatienceMs: 46000, reward: 14 },
        { id: 902, dishId: 'mie-goreng', patienceMs: 38000, maxPatienceMs: 46000, reward: 18 },
      ];
      return;
    }
    if (name === 'play') {
      this.elapsedMs = 45000;
      this.timeLeftMs = SHIFT_MS - 45000;
      this.coins = 42;
      this.score = 470;
      this.combo = 2;
      this.orders = new OrderBoard(rng);
      this.orders.tickets = [
        { id: 911, dishId: 'nasi-goreng', patienceMs: 27000, maxPatienceMs: 46000, reward: 14 },
        { id: 912, dishId: 'mie-goreng', patienceMs: 36000, maxPatienceMs: 46000, reward: 18 },
        { id: 913, dishId: 'sate-ayam', patienceMs: 18000, maxPatienceMs: 46000, reward: 15 },
      ];
      this.startDish('nasi-goreng');
      this.current.stepIndex = 2;
      this.current.choppedCount = 2;
      this.current.chops = ['perfect', 'good'];
      this.current.boardIngredient = 'chili';
      this.current.stage = 'chop';
      this.timingBar.pos = 0.5;
      this.timingBar.active = true;
      return;
    }
    if (name === 'serve') {
      this.elapsedMs = 80000;
      this.timeLeftMs = SHIFT_MS - 80000;
      this.coins = 86;
      this.score = 960;
      this.combo = 3;
      this.orders = new OrderBoard(rng);
      this.orders.tickets = [
        { id: 921, dishId: 'mie-goreng', patienceMs: 22000, maxPatienceMs: 42000, reward: 18 },
        { id: 922, dishId: 'gado-gado', patienceMs: 30000, maxPatienceMs: 42000, reward: 17 },
      ];
      this.startDish('mie-goreng');
      this.current.stepIndex = 4;
      this.current.choppedCount = 4;
      this.current.chops = ['perfect', 'perfect', 'good', 'perfect'];
      this.current.cookProgress = 1;
      this.current.stage = 'plated';
      this.current.perfectDish = false;
      return;
    }
    if (name === 'rush') {
      this.elapsedMs = 120000;
      this.timeLeftMs = 30000;
      this.coins = 132;
      this.score = 1470;
      this.combo = 5;
      this.bestCombo = 5;
      this.orders = new OrderBoard(rng);
      this.orders.tickets = [
        { id: 931, dishId: 'ayam-geprek', patienceMs: 9000, maxPatienceMs: 38000, reward: 16 },
        { id: 932, dishId: 'nasi-goreng', patienceMs: 15000, maxPatienceMs: 38000, reward: 14 },
        { id: 933, dishId: 'mie-goreng', patienceMs: 24000, maxPatienceMs: 38000, reward: 18 },
        { id: 934, dishId: 'gado-gado', patienceMs: 31000, maxPatienceMs: 38000, reward: 17 },
      ];
      this.startDish('ayam-geprek');
      this.current.stepIndex = 3;
      this.current.choppedCount = 3;
      this.current.chops = ['perfect', 'perfect', 'perfect'];
      this.current.cookProgress = 0.65;
      this.current.stage = 'cook';
      this.sound.sizzleStart();
    }
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);
window.__game = game;
attachInput(canvas, game);
game.start();
