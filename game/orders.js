// WARUNG KILAT — the order board.
// Tickets arrive on the board with a dish, a patience bar and a reward.
// Serving the matching dish to the oldest ticket of that dish pays out;
// a ticket whose patience runs out leaves angry and breaks the combo.

import { dishById, ingredientById, pickDish } from './recipes.js';
import { drawIngredientIcon, roundRect, circle } from './art.js';
import { LAYOUT } from './kitchen.js';

let ticketSeq = 1;

export class OrderBoard {
  constructor(rng) {
    this.rng = rng;
    this.tickets = [];
    this.spawnInMs = 1200;
    this.elapsedMs = 0;
  }

  reset() {
    this.tickets = [];
    this.spawnInMs = 1200;
    this.elapsedMs = 0;
  }

  // Difficulty ramps with elapsed shift time: faster spawns, less patience.
  difficulty(elapsedMs) {
    const minutes = elapsedMs / 60000;
    return {
      spawnMs: Math.max(4200, 7500 - minutes * 2600),
      patienceMs: Math.max(30000, 46000 - minutes * 9000),
      unlocked: Math.min(5, 2 + Math.floor(elapsedMs / 45000)),
    };
  }

  update(dtMs, elapsedMs) {
    this.elapsedMs = elapsedMs;
    const diff = this.difficulty(elapsedMs);
    for (const ticket of this.tickets) {
      ticket.patienceMs -= dtMs;
    }
    const expired = this.tickets.filter((t) => t.patienceMs <= 0);
    this.tickets = this.tickets.filter((t) => t.patienceMs > 0);
    if (this.tickets.length < 4) {
      this.spawnInMs -= dtMs;
      if (this.spawnInMs <= 0) {
        this.spawnInMs = diff.spawnMs * (0.85 + this.rng() * 0.3);
        const dish = pickDish(this.rng, diff.unlocked);
        this.tickets.push({
          id: ticketSeq++,
          dishId: dish.id,
          patienceMs: diff.patienceMs,
          maxPatienceMs: diff.patienceMs,
          reward: dish.base,
        });
      }
    }
    return expired;
  }

  // Oldest ticket asking for this dish, or null.
  findTicket(dishId) {
    return this.tickets.find((t) => t.dishId === dishId) || null;
  }

  serve(dishId) {
    const ticket = this.findTicket(dishId);
    if (!ticket) return null;
    this.tickets = this.tickets.filter((t) => t.id !== ticket.id);
    return ticket;
  }

  draw(ctx, timeSec, highlightDishId) {
    for (let i = 0; i < 4; i++) {
      const slot = LAYOUT.tickets[i];
      const ticket = this.tickets[i];
      ctx.save();
      ctx.fillStyle = '#1d2b30';
      ctx.strokeStyle = '#3d545c';
      ctx.lineWidth = 2;
      roundRect(ctx, slot.x, slot.y, slot.w, slot.h, 10);
      ctx.fill();
      ctx.stroke();
      if (!ticket) {
        ctx.fillStyle = '#5d7378';
        ctx.font = 'italic 15px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('— pesanan masuk —', slot.x + slot.w / 2, slot.y + slot.h / 2);
        ctx.restore();
        continue;
      }
      const dish = dishById(ticket.dishId);
      const frac = Math.max(0, ticket.patienceMs / ticket.maxPatienceMs);
      const urgent = frac < 0.3;
      const isMatch = highlightDishId === ticket.dishId;
      if (isMatch) {
        const pulse = 0.5 + 0.5 * Math.sin(timeSec * 6);
        ctx.strokeStyle = `rgba(255, 210, 62, ${0.55 + 0.45 * pulse})`;
        ctx.lineWidth = 4;
        roundRect(ctx, slot.x - 2, slot.y - 2, slot.w + 4, slot.h + 4, 12);
        ctx.stroke();
      }
      // Dish name + reward.
      ctx.fillStyle = urgent ? '#ff8a7a' : '#f5efe0';
      ctx.font = 'bold 17px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(dish.short, slot.x + 12, slot.y + 26);
      // Reward coin (drawn vector — never an emoji, so it renders in
      // every browser) + amount.
      ctx.fillStyle = '#ffd23e';
      circle(ctx, slot.x + slot.w - 56, slot.y + 20, 10);
      ctx.fill();
      ctx.fillStyle = '#7a4a21';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('C', slot.x + slot.w - 56, slot.y + 24);
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${ticket.reward}`, slot.x + slot.w - 12, slot.y + 26);
      // Ingredient icons.
      dish.ingredients.forEach((ingId, idx) => {
        drawIngredientIcon(ctx, ingId, slot.x + 28 + idx * 40, slot.y + 52, 14);
      });
      // Patience bar.
      const barX = slot.x + 12;
      const barY = slot.y + slot.h - 16;
      const barW = slot.w - 24;
      ctx.fillStyle = '#10181b';
      roundRect(ctx, barX, barY, barW, 9, 4);
      ctx.fill();
      ctx.fillStyle = frac > 0.5 ? '#3fae5a' : frac > 0.25 ? '#e8a13c' : '#d9382b';
      if (barW * frac > 6) {
        roundRect(ctx, barX, barY, Math.max(6, barW * frac), 9, 4);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
