# Brainbow

A small collection of puzzle games, each with **100 levels** that start easy and
get progressively harder. Clear a level to unlock the next one. Your progress
and star ratings are saved locally in your browser.

No accounts, no backend, no build step — just static HTML, CSS, and JavaScript.

## The games

| Game | How it works | Difficulty ramp |
| --- | --- | --- |
| **🔤 Word Guess** | Guess the hidden word in six tries, with green/yellow/gray feedback. | Word length grows 4 → 5 → 6 letters; common → obscure. |
| **🔗 Connections** | Sort 16 words into four secret groups of four. | Easy distinct categories → tricky wordplay; fewer mistakes allowed later. |
| **🔢 Digits** | Combine the numbers with +, −, ×, ÷ to reach the target. | More numbers (3 → 6) and larger targets. |

Each level is **deterministic** — level *N* is always the same puzzle — and every
Digits level is generated so a solution is guaranteed to exist. Beat a level to
earn 1–3 **stars** based on how cleanly you solved it.

## Running it

Fully static — no install or build required.

- **Quickest:** open `index.html` in your browser.
- **Any static server:**
  ```bash
  python3 -m http.server 8000    # then visit http://localhost:8000
  ```

It also deploys automatically to GitHub Pages on every push to `main`
(see `.github/workflows/pages.yml`).

## How it's built

```
index.html                     Home screen with the three game cards
wordle.html                    Word Guess (level select + play)
connections.html               Connections (level select + play)
digits.html                    Digits (level select + play)
css/main.css                   Shared styling (dark + light theme aware)
js/common.js                   Seeded RNG, level progress + stars,
                               level-select grid, result screen
js/home.js                     Home screen logic
js/wordle.js                   Word Guess levels
js/connections.js              Connections levels
js/digits.js                   Digits levels
data/wordle.js                 Difficulty-ordered word bands (4/5/6 letters)
data/connections.js            Pool of 60 themed groups across four tiers
```

Scripts are plain classic scripts sharing a global `PZ` namespace (rather than ES
modules) so the pages work even when opened directly over `file://`.

### Determinism & difficulty

`js/common.js` provides a small `xmur3` + `mulberry32` seeded PRNG. Each game
seeds it with the level number, so a given level always produces the same puzzle
while difficulty scales with the level:

- **Word Guess** walks difficulty-ordered word lists, moving to longer bands as
  levels rise.
- **Connections** draws its four groups from a difficulty *tier window* that
  climbs with the level, and lowers the mistake allowance in later levels.
- **Digits** folds a growing set of numbers down to a target with valid
  operations, guaranteeing solvability.

### Saved data

Everything is stored in `localStorage` on your device under
`pz:<game>:progress` — the highest level cleared plus the best star rating for
each level. Nothing leaves your browser.

## Ideas for later

- More games (mini crossword, a Strands-style word search)
- Larger word/answer lists and real dictionary validation for guesses
- Daily challenge mode alongside the level ladder
- Cloud sync of progress across devices
