// WARUNG KILAT — the chop / toss timing bar.
// A marker sweeps back and forth; the player stops it with a click or
// Space. Green centre is Perfect, the amber band is Good, the rest Poor.
// Perfect chops are what build the combo multiplier.

export class TimingBar {
  constructor(speed = 1.15) {
    this.pos = 0;
    this.dir = 1;
    this.speed = speed;
    this.active = false;
  }

  start() {
    this.pos = 0;
    this.dir = 1;
    this.active = true;
  }

  stop() {
    this.active = false;
  }

  update(dtSeconds) {
    if (!this.active) return;
    this.pos += this.dir * this.speed * dtSeconds;
    if (this.pos >= 1) {
      this.pos = 1;
      this.dir = -1;
    } else if (this.pos <= 0) {
      this.pos = 0;
      this.dir = 1;
    }
  }

  evaluate() {
    const p = this.pos;
    if (p >= 0.44 && p <= 0.56) return 'perfect';
    if (p >= 0.3 && p <= 0.7) return 'good';
    return 'poor';
  }

  draw(ctx, x, y, w, h) {
    ctx.save();
    // Track.
    ctx.fillStyle = '#20262b';
    ctx.strokeStyle = '#5b6b66';
    ctx.lineWidth = 2;
    roundRectPath(ctx, x, y, w, h, h / 2);
    ctx.fill();
    ctx.stroke();
    // Zones: poor (red edges), good (amber), perfect (green centre).
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x + 2, y + 2, w * 0.3 - 2, h - 4);
    ctx.fillRect(x + w * 0.7, y + 2, w * 0.3 - 2, h - 4);
    ctx.fillStyle = '#e8a13c';
    ctx.fillRect(x + w * 0.3, y + 2, w * 0.14, h - 4);
    ctx.fillRect(x + w * 0.56, y + 2, w * 0.14, h - 4);
    ctx.fillStyle = '#3fae5a';
    ctx.fillRect(x + w * 0.44, y + 2, w * 0.12, h - 4);
    // Marker.
    const mx = x + this.pos * w;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx, y - 5);
    ctx.lineTo(mx + 7, y + h / 2);
    ctx.lineTo(mx, y + h + 5);
    ctx.lineTo(mx - 7, y + h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
