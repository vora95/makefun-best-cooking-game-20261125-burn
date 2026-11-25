// WARUNG KILAT — kitchen scene renderer and shared layout.
// One canvas, one look: a night warung — dark teal walls, warm lamps,
// wooden counters, a flaming wok. Every hit rect the input layer uses
// lives in LAYOUT so clicks and drawing can never drift apart.

import { INGREDIENTS, dishById, ingredientById } from './recipes.js';
import { drawFlame, drawIngredientIcon, roundRect, circle } from './art.js';

export const W = 1280;
export const H = 720;

function ticketSlot(i) {
  return { x: 16 + i * 308, y: 62, w: 300, h: 88 };
}

export const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 54 },
  tickets: [ticketSlot(0), ticketSlot(1), ticketSlot(2), ticketSlot(3)],
  board: { x: 70, y: 235, w: 280, h: 110 },
  timingBar: { x: 70, y: 360, w: 280, h: 22 },
  wok: { x: 560, y: 215, w: 160, h: 80 },
  stove: { x: 470, y: 300, w: 340, h: 120 },
  cookBar: { x: 470, y: 198, w: 340, h: 16 },
  plate: { x: 1062, y: 310, r: 78 },
  serveBtn: { x: 930, y: 408, w: 264, h: 52 },
  assembly: { x: 16, y: 468, w: 1248, h: 88 },
  ingredients: INGREDIENTS.map((ing, i) => ({
    id: ing.id, x: 16 + i * 158, y: 570, w: 148, h: 118,
  })),
  muteBtn: { x: 1212, y: 10, w: 54, h: 34 },
  startBtn: { x: 490, y: 480, w: 300, h: 64 },
  restartBtn: { x: 490, y: 480, w: 300, h: 64 },
};

export function drawBackground(ctx, t) {
  // Wall: deep teal gradient with tile lines.
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#16323a');
  grad.addColorStop(0.55, '#1d3d44');
  grad.addColorStop(1, '#241d18');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let y = 80; y < 460; y += 56) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // Hanging lamps.
  for (const lx of [220, 640, 1060]) {
    ctx.strokeStyle = '#0e1a1e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, 34);
    ctx.stroke();
    const glow = ctx.createRadialGradient(lx, 52, 4, lx, 52, 90);
    glow.addColorStop(0, 'rgba(255, 196, 90, 0.55)');
    glow.addColorStop(1, 'rgba(255, 196, 90, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 90, -20, 180, 180);
    ctx.fillStyle = '#ffb43a';
    circle(ctx, lx, 52, 13);
    ctx.fill();
    ctx.fillStyle = '#7a4a21';
    ctx.fillRect(lx - 18, 38, 36, 8);
  }
  // Wooden counter top.
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(0, 556, W, 16);
  ctx.fillStyle = '#7d5230';
  ctx.fillRect(0, 556, W, 5);
}

export function drawStations(ctx, game, t) {
  // ---- Chopping board station ----
  ctx.fillStyle = '#24363c';
  roundRect(ctx, 40, 200, 340, 200, 12);
  ctx.fill();
  ctx.fillStyle = '#f5efe0';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TALENAN — klik / Spasi untuk cincang', 56, 222);
  // Board.
  ctx.fillStyle = '#c89b62';
  roundRect(ctx, LAYOUT.board.x, LAYOUT.board.y, LAYOUT.board.w, LAYOUT.board.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#8a6134';
  ctx.lineWidth = 3;
  roundRect(ctx, LAYOUT.board.x, LAYOUT.board.y, LAYOUT.board.w, LAYOUT.board.h, 10);
  ctx.stroke();
  const cur = game.current;
  if (cur && cur.stage === 'chop' && cur.boardIngredient) {
    drawIngredientIcon(ctx, cur.boardIngredient, 210, 290, 44);
    ctx.fillStyle = '#3a2a12';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CINCANG SEKARANG!', 210, 335);
  } else if (cur && cur.stage === 'pick') {
    ctx.fillStyle = '#7a5c33';
    ctx.font = 'italic 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('pilih bahan di bawah', 210, 292);
  }
  // Timing bar.
  if (cur && cur.stage === 'chop' && game.timingBar.active) {
    game.timingBar.draw(ctx, LAYOUT.timingBar.x, LAYOUT.timingBar.y, LAYOUT.timingBar.w, LAYOUT.timingBar.h);
  }

  // ---- Stove + wok station ----
  ctx.fillStyle = '#24363c';
  roundRect(ctx, 440, 168, 400, 232, 12);
  ctx.fill();
  ctx.fillStyle = '#f5efe0';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('WAJAN — api besar, jangan gosong!', 456, 190);
  // Cook progress bar.
  if (cur && (cur.stage === 'cook' || cur.stage === 'plated')) {
    const frac = Math.min(1, cur.cookProgress);
    ctx.fillStyle = '#10181b';
    roundRect(ctx, LAYOUT.cookBar.x, LAYOUT.cookBar.y, LAYOUT.cookBar.w, LAYOUT.cookBar.h, 8);
    ctx.fill();
    ctx.fillStyle = cur.burnt ? '#d9382b' : '#ff7a1a';
    if (LAYOUT.cookBar.w * frac > 8) {
      roundRect(ctx, LAYOUT.cookBar.x, LAYOUT.cookBar.y, Math.max(8, LAYOUT.cookBar.w * frac), LAYOUT.cookBar.h, 8);
      ctx.fill();
    }
    if (cur.stage === 'cook' && cur.cookProgress >= 1) {
      ctx.fillStyle = '#ff8a7a';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MATANG! CEPAT PLATING (P)!', 640, 236);
    }
  }
  // Stove body + burners + flames.
  ctx.fillStyle = '#2c2f33';
  roundRect(ctx, LAYOUT.stove.x, LAYOUT.stove.y, LAYOUT.stove.w, LAYOUT.stove.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#565d63';
  ctx.lineWidth = 2;
  roundRect(ctx, LAYOUT.stove.x, LAYOUT.stove.y, LAYOUT.stove.w, LAYOUT.stove.h, 10);
  ctx.stroke();
  const cooking = cur && (cur.stage === 'cook' || cur.stage === 'plated');
  // Wok bowl.
  ctx.fillStyle = '#1c1e20';
  ctx.beginPath();
  ctx.arc(640, 268, 82, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#565d63';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(640, 268, 82, 0, Math.PI);
  ctx.stroke();
  // Burner flames lick the bottom of the wok (drawn after the bowl so
  // they stay visible over the stove).
  if (cooking) {
    drawFlame(ctx, 585, 358, 26, t, 1);
    drawFlame(ctx, 640, 358, 30, t, 2);
    drawFlame(ctx, 695, 358, 26, t, 3);
  }
  if (cur && (cur.stage === 'cook' || cur.stage === 'plated')) {
    const dish = dishById(cur.dishId);
    const shown = dish.ingredients.slice(0, cur.choppedCount);
    shown.forEach((ingId, idx) => {
      drawIngredientIcon(ctx, ingId, 600 + idx * 28, 300, 15);
    });
    if (cur.burnt) {
      ctx.fillStyle = 'rgba(60, 60, 60, 0.85)';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOSONG!', 640, 300);
    }
  } else if (cur && cur.stage === 'chop') {
    ctx.fillStyle = '#8a9399';
    ctx.font = 'italic 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('wajan menunggu…', 640, 300);
  }

  // ---- Plate station ----
  ctx.fillStyle = '#24363c';
  roundRect(ctx, 880, 168, 384, 232, 12);
  ctx.fill();
  ctx.fillStyle = '#f5efe0';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PIRING SAJI', 896, 190);
  // Plate.
  ctx.fillStyle = '#f5f2e8';
  circle(ctx, LAYOUT.plate.x, LAYOUT.plate.y, LAYOUT.plate.r);
  ctx.fill();
  ctx.strokeStyle = '#b9b2a0';
  ctx.lineWidth = 3;
  circle(ctx, LAYOUT.plate.x, LAYOUT.plate.y, LAYOUT.plate.r);
  ctx.stroke();
  ctx.strokeStyle = '#d8d2c0';
  ctx.lineWidth = 2;
  circle(ctx, LAYOUT.plate.x, LAYOUT.plate.y, LAYOUT.plate.r - 16);
  ctx.stroke();
  if (cur && cur.stage === 'plated') {
    const dish = dishById(cur.dishId);
    dish.ingredients.forEach((ingId, idx) => {
      drawIngredientIcon(ctx, ingId, LAYOUT.plate.x - 44 + idx * 30, LAYOUT.plate.y + 6, 17);
    });
    ctx.fillStyle = '#2c4a2c';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dish.short.toUpperCase(), LAYOUT.plate.x, LAYOUT.plate.y - 44);
    if (cur.perfectDish) {
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText('★ PERFECT ★', LAYOUT.plate.x, LAYOUT.plate.y + 52);
    }
  }
  // Serve button.
  const canServe = cur && cur.stage === 'plated' && game.orders.findTicket(cur.dishId);
  ctx.fillStyle = canServe ? '#e8a13c' : '#4a5458';
  roundRect(ctx, LAYOUT.serveBtn.x, LAYOUT.serveBtn.y, LAYOUT.serveBtn.w, LAYOUT.serveBtn.h, 10);
  ctx.fill();
  ctx.fillStyle = canServe ? '#241a05' : '#c8c8c8';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAJIKAN  (S)', LAYOUT.serveBtn.x + LAYOUT.serveBtn.w / 2, LAYOUT.serveBtn.y + 34);
}

export function drawAssemblyStrip(ctx, game) {
  ctx.fillStyle = '#1d2b30';
  roundRect(ctx, LAYOUT.assembly.x, LAYOUT.assembly.y, LAYOUT.assembly.w, LAYOUT.assembly.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#3d545c';
  ctx.lineWidth = 2;
  roundRect(ctx, LAYOUT.assembly.x, LAYOUT.assembly.y, LAYOUT.assembly.w, LAYOUT.assembly.h, 10);
  ctx.stroke();
  const cur = game.current;
  ctx.fillStyle = '#f5efe0';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  if (!cur) {
    ctx.fillText('HIDANGAN: —', 32, 500);
    ctx.fillStyle = '#9fb4b8';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('Klik bahan pertama dari resep mana pun untuk mulai masak.', 32, 528);
    return;
  }
  const dish = dishById(cur.dishId);
  ctx.fillText(`HIDANGAN: ${dish.name.toUpperCase()}`, 32, 500);
  const stageText = {
    pick: 'Pilih bahan berikutnya sesuai urutan resep.',
    chop: 'Cincang! Hentikan penanda di zona hijau.',
    cook: 'Masak di wajan… plating sebelum gosong!',
    plated: 'Siap disajikan — klik tiket yang cocok atau tombol SAJIKAN.',
    burnt: 'Gosong! Hidangan hangus — mulai lagi.',
  }[cur.stage] || '';
  ctx.fillStyle = '#ffd23e';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText(stageText, 32, 528);
  // Recipe slots.
  dish.ingredients.forEach((ingId, idx) => {
    const cx = 880 + idx * 72;
    const cy = 512;
    const done = idx < cur.choppedCount || (cur.stage === 'plated' && idx < dish.ingredients.length);
    const isNext = cur.stage === 'pick' && idx === cur.stepIndex;
    ctx.fillStyle = done ? '#2c4a2c' : '#10181b';
    ctx.strokeStyle = isNext ? '#ffd23e' : '#5b6b66';
    ctx.lineWidth = isNext ? 3 : 2;
    circle(ctx, cx, cy, 28);
    ctx.fill();
    ctx.stroke();
    if (done || isNext) drawIngredientIcon(ctx, ingId, cx, cy, 17);
    else {
      ctx.fillStyle = '#5d7378';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', cx, cy + 6);
    }
    if (idx < dish.ingredients.length - 1) {
      ctx.fillStyle = '#5d7378';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('›', cx + 38, cy + 6);
    }
  });
}

export function drawIngredientCounter(ctx, game, t) {
  ctx.fillStyle = '#24363c';
  roundRect(ctx, 8, 562, 1264, 134, 12);
  ctx.fill();
  for (const slot of LAYOUT.ingredients) {
    const ing = ingredientById(slot.id);
    const isNext = game.current && game.current.stage === 'pick'
      && dishById(game.current.dishId).ingredients[game.current.stepIndex] === slot.id;
    const hover = game.hover && game.hover.x >= slot.x && game.hover.x <= slot.x + slot.w
      && game.hover.y >= slot.y && game.hover.y <= slot.y + slot.h;
    ctx.fillStyle = isNext ? '#3a2f10' : hover ? '#2c3e44' : '#1d2b30';
    ctx.strokeStyle = isNext ? '#ffd23e' : '#3d545c';
    ctx.lineWidth = isNext ? 3 : 2;
    roundRect(ctx, slot.x, slot.y, slot.w, slot.h, 10);
    ctx.fill();
    ctx.stroke();
    drawIngredientIcon(ctx, slot.id, slot.x + slot.w / 2, slot.y + 42, 26);
    ctx.fillStyle = '#f5efe0';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ing.name, slot.x + slot.w / 2, slot.y + 88);
    ctx.fillStyle = '#9fb4b8';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`tombol ${ing.key}`, slot.x + slot.w / 2, slot.y + 106);
  }
}
