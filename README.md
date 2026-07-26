# Daily Puzzles

A small collection of daily brain puzzles in the spirit of the New York Times
Games app. Three fresh puzzles are generated every day — the same for everyone —
and your streaks and stats are saved locally in your browser.

No accounts, no backend, no build step. Just static HTML, CSS, and JavaScript.

## The puzzles

| Puzzle | How it works |
| --- | --- |
| **🔤 Word Guess** | Guess the hidden 5-letter word in six tries, with green/yellow/gray feedback (a Wordle-style game). |
| **🔗 Connections** | Sort 16 words into four secret groups of four. Four mistakes allowed. |
| **🔢 Digits** | Combine six numbers using +, −, ×, and ÷ to reach the target. |

Each puzzle is **deterministic per day**: the date seeds the generator, so every
player gets the same puzzle, and a new set unlocks at local midnight. A live
countdown to the next puzzles appears when you finish.

## Running it

It's a fully static site — no install or build required.

- **Quickest:** open `index.html` directly in your browser.
- **Recommended (any static server):**
  ```bash
  python3 -m http.server 8000
  # then visit http://localhost:8000
  ```

Because there is no backend, deploying is as simple as hosting these files on any
static host (GitHub Pages, Netlify, etc.).

## How it's built

```
index.html            Home screen with the three puzzle cards
wordle.html           Word Guess
connections.html      Connections
digits.html           Digits
css/main.css          Shared styling (dark + light theme aware)
js/common.js          Shared utilities: date/day numbering, seeded RNG,
                      localStorage stats & streaks, nav, countdown
js/home.js            Home screen logic
js/wordle.js          Word Guess logic
js/connections.js     Connections logic
js/digits.js          Digits logic (deterministic, always-solvable generator)
data/wordle.js        Curated 5-letter answer list
data/connections.js   Pool of themed groups across four difficulty tiers
```

Scripts are plain classic scripts sharing a global `PZ` namespace (rather than ES
modules) so the pages work even when opened directly over `file://`.

### Determinism

`js/common.js` assigns each day an integer "day number" counted from a fixed
epoch. That number seeds a small `xmur3` + `mulberry32` PRNG, which drives:

- **Word Guess** — walks the answer list by day number (no repeats until the list
  is exhausted).
- **Connections** — picks one group from each difficulty tier, guaranteeing 16
  distinct words.
- **Digits** — folds six random numbers down with valid operations to derive a
  target, so a solution is always guaranteed to exist.

### Saved data

Everything is stored in `localStorage` on your device:

- `pz:<game>:stats` — games played, win %, current streak, max streak, and (for
  Word Guess) the guess distribution.
- `pz:<game>:state` — today's in-progress or finished board, so a refresh resumes
  where you left off.

Nothing leaves your browser.

## Ideas for later

- More puzzle types (mini crossword, a Strands-style word search)
- Larger answer/dictionary lists and true dictionary validation for guesses
- Optional accounts + cross-device sync
- A combined "play all three" streak
