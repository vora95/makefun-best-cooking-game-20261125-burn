// WARUNG KILAT — the hand-in program (Node 22, standard library only).
//
// It hands the game in: it copies this repository's game/ and
// screenshots/ into the output directory and writes dossier.json there,
// the summary the judge reads, built with the kit's vendored library.
// The grader runs it twice and both runs must write the same bytes.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the directory holding this file.
const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyDir(name: string): void {
  const from = join(root, name);
  if (!existsSync(from)) return;
  cpSync(from, join(outDir, name), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyDir('game');
copyDir('screenshots');

// Fail fast with a readable message when a piece of the entry is missing,
// instead of letting the dossier builder throw from deep inside its code.
if (!existsSync(join(outDir, 'game', 'index.html'))) {
  throw new Error(`main.ts: game/index.html is missing in ${outDir}`);
}
const shotFiles = readdirSync(join(outDir, 'screenshots')).filter((f) => !f.startsWith('.'));
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`main.ts: screenshots/ must hold 3 or 4 images, found ${shotFiles.length}`);
}

// The gate's own caps, from the competition's RULES.txt: at most 4
// screenshots of 256 KiB each, at most 993 files / 48 MiB under game/,
// and the dossier text capped at 160 KiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`handed in ${shotFiles.length} screenshots + dossier.json to ${outDir}`);
