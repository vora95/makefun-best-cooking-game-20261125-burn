// WARUNG KILAT — mouse + keyboard input.
// Clicks are mapped from CSS pixels back to the 1280x720 canvas space;
// keys mirror every click action so the game plays with keyboard alone.

import { LAYOUT } from './kitchen.js';

function toCanvas(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * 1280,
    y: ((clientY - rect.top) / rect.height) * 720,
  };
}

export function attachInput(canvas, game) {
  canvas.addEventListener('click', (ev) => {
    const pos = toCanvas(canvas, ev.clientX, ev.clientY);
    game.sound.ensure();
    game.handleClick(pos.x, pos.y);
  });

  canvas.addEventListener('mousemove', (ev) => {
    game.hover = toCanvas(canvas, ev.clientX, ev.clientY);
  });

  canvas.addEventListener('mouseleave', () => {
    game.hover = null;
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.code === 'Space') ev.preventDefault();
    if (ev.repeat) return;
    game.sound.ensure();
    const key = ev.key.toLowerCase();
    if (key >= '1' && key <= '8') {
      const idx = Number(key) - 1;
      game.pickIngredient(game.ingredientIds[idx]);
      return;
    }
    if (ev.code === 'Space' || ev.code === 'Enter') {
      game.primaryAction();
      return;
    }
    if (key === 'p') {
      game.plateDish();
      return;
    }
    if (key === 's') {
      game.serveDish();
      return;
    }
    if (key === 'x') {
      game.discardDish();
      return;
    }
    if (key === 'm') {
      game.toggleMute();
    }
  });
}
