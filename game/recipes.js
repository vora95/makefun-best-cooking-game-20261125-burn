// WARUNG KILAT — recipes and ingredients.
// Every dish is an original Warung Kilat creation: Indonesian street food
// with its own names. A dish is a chain of ingredients in order; the
// player must add them in exactly this order to complete the dish.

export const INGREDIENTS = [
  { id: 'rice', name: 'Nasi', key: '1', color: '#f7f2df', dark: '#d8cf9f' },
  { id: 'noodle', name: 'Mie', key: '2', color: '#f2c14e', dark: '#c98f1b' },
  { id: 'egg', name: 'Telur', key: '3', color: '#fff6da', dark: '#f0a832' },
  { id: 'chicken', name: 'Ayam', key: '4', color: '#c97b3d', dark: '#8a4f1d' },
  { id: 'chili', name: 'Cabai', key: '5', color: '#d9382b', dark: '#8f1d12' },
  { id: 'veg', name: 'Sayur', key: '6', color: '#58a34a', dark: '#2f6b28' },
  { id: 'sauce', name: 'Saus', key: '7', color: '#7a4a21', dark: '#4c2c10' },
  { id: 'tofu', name: 'Tahu', key: '8', color: '#fdf6e3', dark: '#cbb37a' },
];

export const DISHES = [
  {
    id: 'nasi-goreng', name: 'Nasi Goreng Kilat', short: 'Nasi Goreng',
    ingredients: ['rice', 'egg', 'chili'], base: 14, cookMs: 3800,
    blurb: 'Nasi, telur, cabai — kilat di wajan.',
  },
  {
    id: 'mie-goreng', name: 'Mie Goreng Pedas', short: 'Mie Goreng',
    ingredients: ['noodle', 'chicken', 'chili', 'sauce'], base: 18, cookMs: 4200,
    blurb: 'Mie pedas empat langkah, jangan sampai gosong.',
  },
  {
    id: 'sate-ayam', name: 'Sate Ayam Bakar', short: 'Sate Ayam',
    ingredients: ['chicken', 'sauce', 'veg'], base: 15, cookMs: 3600,
    blurb: 'Ayam bakar, saus kacang, sayur segar.',
  },
  {
    id: 'gado-gado', name: 'Gado-Gado Segar', short: 'Gado-Gado',
    ingredients: ['veg', 'tofu', 'egg', 'sauce'], base: 17, cookMs: 4000,
    blurb: 'Sayur, tahu, telur, saus — segar dan cepat.',
  },
  {
    id: 'ayam-geprek', name: 'Ayam Geprek', short: 'Ayam Geprek',
    ingredients: ['chicken', 'chili', 'rice'], base: 16, cookMs: 3800,
    blurb: 'Ayam geprek cabai, nasi hangat.',
  },
];

export function ingredientById(id) {
  return INGREDIENTS.find((item) => item.id === id) || null;
}

export function dishById(id) {
  return DISHES.find((dish) => dish.id === id) || null;
}

// Small deterministic PRNG (mulberry32) so screenshot shots are stable.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickDish(rng, unlockedCount) {
  const pool = DISHES.slice(0, Math.max(1, Math.min(DISHES.length, unlockedCount)));
  return pool[Math.floor(rng() * pool.length)];
}
