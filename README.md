# WARUNG KILAT — Midnight Wok Rush

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/vora95/makefun-best-cooking-game-20261125-burn/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/vora95/makefun-best-cooking-game-20261125-burn/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete original cooking game for the make.fun best cooking game bounty.
One shift, 150 seconds: tickets arrive on the order board, and you build
each dish as a chain — pick ingredients in recipe order, chop them on a
timing bar, cook them in the wok before they burn, plate, and serve.

## How to play

- **Pick** an ingredient on the counter (click, or keys 1–8) in the order
  the recipe asks for. A wrong ingredient shakes the board.
- **Chop** it on the board (click the board, or Space) — stop the marker
  in the green zone for a Perfect chop.
- **Cook** it in the wok. Toss with Space for a bonus coin (up to 3 per
  dish). Plate with P or by clicking the plate before it burns.
- **Serve** it to a matching ticket (click the ticket, the SAJIKAN button,
  or S). Perfect chains build a combo multiplier up to x2.
- A ticket whose patience runs out leaves and resets your combo. Earn 120
  coins in the shift to win.

## Dishes (5 recipes, 8 ingredients)

Nasi Goreng Kilat, Mie Goreng Pedas, Sate Ayam Bakar, Gado-Gado Segar,
Ayam Geprek — Indonesian street food, drawn as original vector art, with
synthesized WebAudio sounds (no audio files, no network requests).

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

`main.ts` (Node 22, standard library only) hands the game in: it copies
`game/` and `screenshots/` to the output directory and writes
`dossier.json` with the kit's vendored library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
