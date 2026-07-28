# Brainbow

**Play it: https://brainbow-puzzle.github.io**

A small collection of puzzle games, each with **200 levels** that start easy and
get progressively harder. Every level is open from the start — play them in any
order. Your progress and star ratings are saved locally in your browser.

No accounts, no backend, no build step — just static HTML, CSS, and JavaScript.

Brainbow is also an installable **PWA**: open it on a phone and add it to your
home screen to get an app icon, a fullscreen (no browser bars) experience, and
full offline play — the whole app is cached on first visit.

## The games

| Game | How it works | Difficulty ramp |
| --- | --- | --- |
| **🔤 Word Guess** | Guess the hidden word in six tries, with green/yellow/gray feedback. | Word length grows 4 → 5 → 6 → 7 letters, and the guess allowance drops to 5 then 4 near the top; every level has a unique answer. |
| **🔗 Affinity** | Sort 16 words into four secret groups of four (a Connections-style game). | Easy distinct categories → tricky wordplay; fewer mistakes allowed later. |
| **🔢 Crunch** | Combine the numbers with +, −, ×, ÷ to reach the target. | More numbers (3 → 6), then bigger source numbers and much larger targets after level 100. |

Each level is **deterministic** — level *N* is always the same puzzle — and every
Crunch level is generated so a solution is guaranteed to exist. Beat a level to
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
connections.html               Affinity (level select + play)
digits.html                    Crunch (level select + play)
css/main.css                   Shared styling (dark + light theme aware)
js/common.js                   Seeded RNG, level progress + stars,
                               level-select grid, result screen
js/home.js                     Home screen logic
js/wordle.js                   Word Guess levels
js/connections.js              Affinity levels
js/digits.js                   Crunch levels
data/wordle.js                 Difficulty-ordered word bands (4/5/6/7 letters)
data/connections.js            Pool of 420 themed groups across three tiers
manifest.json                  PWA metadata (name, icons, standalone display)
sw.js                          Service worker: precaches the app for offline play
icons/                         App icons (192/256/512 + maskable + Apple touch)
```

### Installing on a phone

- **Android / Chrome:** open the site and accept the "Install app" prompt, or
  use the browser menu -> *Install app*.
- **iPhone / Safari:** open the site, tap the Share button, then
  *Add to Home Screen*.

After the first load the app works with no connection at all. The only feature
that needs the network is the Affinity hint lookup for words outside the
bundled definitions.

When assets change, bump the `?v=` query strings in the HTML **and** the
`CACHE` name in `sw.js` so installed copies pick up the new version.

Scripts are plain classic scripts sharing a global `PZ` namespace (rather than ES
modules) so the pages work even when opened directly over `file://`.

### Determinism & difficulty

`js/common.js` provides a small `xmur3` + `mulberry32` seeded PRNG. Each game
seeds it with the level number, so a given level always produces the same puzzle
while difficulty scales with the level:

- **Word Guess** walks difficulty-ordered word lists, moving to longer bands as
  levels rise.
- **Affinity** draws its four groups from a difficulty *tier window* that
  climbs with the level, and lowers the mistake allowance in later levels.
- **Crunch** folds a growing set of numbers down to a target with valid
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
