// WARUNG KILAT — vector art helpers.
// Every food icon is drawn from shapes, so the game needs no image files
// and looks the same in every browser.

export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
}

// Draw one ingredient pictogram centred at (cx, cy) with radius r.
export function drawIngredientIcon(ctx, id, cx, cy, r) {
  ctx.save();
  ctx.lineWidth = Math.max(1.5, r * 0.09);
  ctx.strokeStyle = 'rgba(20, 20, 16, 0.55)';
  switch (id) {
    case 'rice': {
      // Bowl of steamed rice.
      ctx.fillStyle = '#3f6d8e';
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.15, r * 0.85, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f7f2df';
      circle(ctx, cx - r * 0.28, cy - r * 0.18, r * 0.34);
      ctx.fill();
      circle(ctx, cx + r * 0.25, cy - r * 0.22, r * 0.3);
      ctx.fill();
      circle(ctx, cx, cy - r * 0.38, r * 0.3);
      ctx.fill();
      break;
    }
    case 'noodle': {
      // Bowl of wavy noodles.
      ctx.fillStyle = '#3f6d8e';
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.2, r * 0.85, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#f2c14e';
      ctx.lineWidth = r * 0.22;
      for (let i = 0; i < 3; i++) {
        const y = cy - r * 0.42 + i * r * 0.24;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.55, y);
        ctx.quadraticCurveTo(cx - r * 0.25, y - r * 0.2, cx, y);
        ctx.quadraticCurveTo(cx + r * 0.25, y + r * 0.2, cx + r * 0.55, y);
        ctx.stroke();
      }
      break;
    }
    case 'egg': {
      // Fried egg: white blob + yolk.
      ctx.fillStyle = '#fff6da';
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.85, r * 0.62, 0.25, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f0a832';
      circle(ctx, cx + r * 0.08, cy, r * 0.38);
      ctx.fill();
      ctx.fillStyle = '#ffd977';
      circle(ctx, cx - r * 0.02, cy - r * 0.08, r * 0.16);
      ctx.fill();
      break;
    }
    case 'chicken': {
      // Drumstick.
      ctx.fillStyle = '#c97b3d';
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.08, cy + r * 0.05, r * 0.62, r * 0.5, -0.5, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8a4f1d';
      circle(ctx, cx - r * 0.3, cy - r * 0.12, r * 0.16);
      ctx.fill();
      ctx.strokeStyle = '#fdf6e3';
      ctx.lineWidth = r * 0.14;
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.42, cy - r * 0.3);
      ctx.lineTo(cx + r * 0.78, cy - r * 0.62);
      ctx.moveTo(cx + r * 0.5, cy - r * 0.18);
      ctx.lineTo(cx + r * 0.86, cy - r * 0.42);
      ctx.stroke();
      break;
    }
    case 'chili': {
      // Red chilli pepper.
      ctx.fillStyle = '#d9382b';
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.62, cy - r * 0.45);
      ctx.quadraticCurveTo(cx + r * 0.1, cy - r * 0.95, cx + r * 0.68, cy - r * 0.25);
      ctx.quadraticCurveTo(cx + r * 0.85, cy + r * 0.1, cx + r * 0.45, cy + r * 0.42);
      ctx.quadraticCurveTo(cx - r * 0.1, cy + r * 0.72, cx - r * 0.55, cy + r * 0.3);
      ctx.quadraticCurveTo(cx - r * 0.8, cy + r * 0.05, cx - r * 0.62, cy - r * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#58a34a';
      ctx.lineWidth = r * 0.16;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.55, cy - r * 0.42);
      ctx.quadraticCurveTo(cx - r * 0.4, cy - r * 0.8, cx - r * 0.1, cy - r * 0.85);
      ctx.stroke();
      break;
    }
    case 'veg': {
      // Leafy greens.
      ctx.fillStyle = '#58a34a';
      for (const [dx, dy, rot] of [[-0.3, 0.1, -0.6], [0.05, -0.15, 0.2], [0.32, 0.12, 0.7]]) {
        ctx.beginPath();
        ctx.ellipse(cx + dx * r, cy + dy * r, r * 0.42, r * 0.24, rot, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.strokeStyle = '#2f6b28';
      ctx.lineWidth = r * 0.1;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.5, cy + r * 0.5);
      ctx.lineTo(cx + r * 0.5, cy + r * 0.45);
      ctx.stroke();
      break;
    }
    case 'sauce': {
      // Sauce bottle with a drip.
      ctx.fillStyle = '#7a4a21';
      roundRect(ctx, cx - r * 0.34, cy - r * 0.25, r * 0.68, r * 0.85, r * 0.16);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#4c2c10';
      ctx.fillRect(cx - r * 0.18, cy - r * 0.62, r * 0.36, r * 0.42);
      ctx.fillStyle = '#d9382b';
      circle(ctx, cx + r * 0.42, cy + r * 0.28, r * 0.16);
      ctx.fill();
      break;
    }
    case 'tofu': {
      // Tofu cube.
      ctx.fillStyle = '#fdf6e3';
      roundRect(ctx, cx - r * 0.55, cy - r * 0.4, r * 1.1, r * 0.8, r * 0.14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#cbb37a';
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.55, cy + r * 0.4);
      ctx.lineTo(cx - r * 0.3, cy + r * 0.62);
      ctx.lineTo(cx + r * 0.55, cy + r * 0.62);
      ctx.lineTo(cx + r * 0.55, cy + r * 0.4);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default: {
      ctx.fillStyle = '#cccccc';
      circle(ctx, cx, cy, r * 0.6);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Small flame, drawn with two flickering layers; t is seconds.
export function drawFlame(ctx, cx, baseY, size, t, seed) {
  const flick = Math.sin(t * 9 + seed * 7) * 0.12 + Math.sin(t * 17 + seed * 3) * 0.07;
  const h = size * (1 + flick);
  ctx.save();
  ctx.fillStyle = '#ff7a1a';
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.55, baseY);
  ctx.quadraticCurveTo(cx - size * 0.6, baseY - h * 0.55, cx, baseY - h);
  ctx.quadraticCurveTo(cx + size * 0.6, baseY - h * 0.55, cx + size * 0.55, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd23e';
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.3, baseY);
  ctx.quadraticCurveTo(cx - size * 0.32, baseY - h * 0.4, cx, baseY - h * 0.62);
  ctx.quadraticCurveTo(cx + size * 0.32, baseY - h * 0.4, cx + size * 0.3, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
