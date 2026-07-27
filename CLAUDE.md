# Brainbow — working notes for Claude

Brainbow is a static, offline-capable puzzle web app. No backend, no build
step, no dependencies. Live at **https://brainbow-puzzle.github.io** (this
repo is the user-site repo, so it publishes at the domain root).

## Non-negotiables

1. **No build step, no frameworks.** Plain HTML/CSS/ES5-style JS. Scripts are
   classic `<script>` tags sharing one global `PZ` namespace (not ES modules)
   so every page also works opened directly over `file://`.
2. **Bump cache versions on every asset change** — see "Shipping" below. Miss
   this and installed PWAs keep serving stale files.
3. **Never change a level's generated content casually.** Levels are
   deterministic from their number; changing a seed or scheduler reshuffles
   puzzles players have already solved. It is sometimes the right call, but
   say so explicitly in the commit message.
4. **Verify in a real browser before pushing.** Playwright is not installed;
   install it on demand (see "Testing").

## Layout

```
index.html          Home: game cards + themed packs
wordle.html         Word Guess      (level select + play)
connections.html    Affinity        (level select + play)
digits.html         Digits          (level select + play)
peru.html           Peru Affinity   (10-puzzle themed pack)

js/common.js        Shared engine: seeded RNG, progress/stars storage,
                    level grid, play-nav, result overlay, hints, toasts,
                    win/lose phrase pools, nav
js/cn-engine.js     Shared Affinity gameplay — drives BOTH connections.js
                    and peru.js. Fix grouping bugs HERE, once.
js/connections.js   Affinity: level scheduler + config only (~80 lines)
js/peru.js          Peru pack: config only (~28 lines)
js/wordle.js        Word Guess logic
js/digits.js        Digits logic
js/home.js          Home cards

data/wordle.js      WORDLE_BANDS: four/five/six/seven-letter answer lists
data/connections.js CONNECTIONS_GROUPS: 420 groups tagged d:1|2|3
data/peru.js        PERU_PUZZLES: 10 hand-authored puzzles
data/definitions.js BRAINBOW_DEFS: curated word explanations for hints

manifest.json       PWA metadata      sw.js      Service worker (offline)
icons/              App icons (+ icon.svg source)
.github/workflows/pages.yml   Deploys to Pages on push to main
```

## Game rules and difficulty

**All three main games have 200 levels.** The Peru pack has 10.

- **Word Guess** — one unique answer per level, never repeated. Bands:
  4 letters (1–50), 5 (51–120), 6 (121–175), 7 (176–200). Guess allowance
  tightens: 6 tries through 150, 5 through 190, 4 for 191–200. Stars scale
  with the allowance (`ROWS/2` → 3★).
- **Affinity** — every level takes 1 green + 2 blue + 1 purple group.
  Mistakes allowed: 4 through level 70, 3 through 140, then 2.
  A least-recently-used scheduler guarantees **no category repeats within
  100 levels** (measured min gap 103); each is used at most twice.
  If you add or remove categories, re-run the gap check before pushing.
- **Digits** — always solvable by construction (the generator folds the
  numbers down to derive the target). Levels 1–100 ramp 3→6 tiles; 101–200
  keep six tiles but use bigger source numbers (up to 75) and larger targets.
  **Any generator change must be re-verified with the brute-force solver.**

**Progress model** (`js/common.js`): `{reached, stars:{lvl:n}, lost:{lvl:true}}`
in `localStorage` under `pz:<game>:progress`.
- Win → stars, level replayable.
- **Lose → final.** No replay, ever. The level is marked lost, shows a red ✕,
  and opens **read-only for review** (Affinity reveals all groups; Word Guess
  reveals the answer). A loss still advances `reached`, so players are never
  stuck.
- `PZ.canOpen()` gates entry; `openable()` is the batch variant.

**Hints** (Affinity + Peru): 2 per puzzle. Select exactly one word → 💡 Hint →
an encyclopedia-style explanation. Curated `BRAINBOW_DEFS` first, then the
Wikipedia REST summary. A failed lookup does **not** consume a hint.

## Voice and theme

Pride-inspired but tasteful: rainbow gradients as accents (wordmark, titles,
progress bars, primary buttons, next-level ring) over a calm dark/light base.
Wins and losses show random phrases from `PRAISE` / `SASHAY` in `common.js`
("Slay! 💅", "Sashay away 💅"). Keep additions warm and playful, never mean.

## Shipping

```bash
# 1. bump BOTH, in lockstep:
sed -i -E 's/\?v=[0-9]+/?v=NN/g' index.html wordle.html connections.html digits.html peru.html
#    and CACHE = "brainbow-vNN" in sw.js
# 2. commit + push to main — the Pages workflow deploys automatically
git push origin main
```

Deploy status: repo **Actions** tab → "Deploy to GitHub Pages".
If a run fails instantly with no logs, it is the environment gate:
Settings → Environments → `github-pages` → Deployment branches → No restriction.

## Analytics

Visitor counts come from **Cloudflare Web Analytics** — cookieless, no consent
banner, free. The whole integration is `CF_BEACON_TOKEN` near the bottom of
`js/common.js`: paste the site token there to switch counting on, blank it to
switch it off. No other file knows about it.

The loader deliberately stays silent when the token is blank, on `file://`,
and on `localhost`/`127.0.0.1`, so local testing never pollutes the numbers.
It is wrapped in try/catch — counting visitors must never break a puzzle.
`sw.js` already passes cross-origin requests straight through, so the beacon
needs no service-worker changes.

**The numbers are a floor, not a total.** Brainbow is an offline-capable PWA:
once installed, someone can play for weeks without the beacon ever firing.
Ad blockers hide more. Read the dashboard as a trend, not a headcount.

## Testing

Playwright is not a dependency; install it per-session and drive real Chromium:

```bash
npm install --no-save playwright@latest
NODE_PATH=$PWD/node_modules node test.js   # executablePath: /opt/pw-browsers/chromium-1194/chrome-linux/chrome
rm -rf node_modules package.json package-lock.json   # keep the repo clean
```

- Service workers need HTTP — serve with `python3 -m http.server 8099`;
  `file://` is fine for everything else.
- For data/scheduler changes, prefer a plain Node script that evals
  `js/common.js` + the data file and checks invariants across all 200 levels
  (uniqueness, no word collisions, category gaps, Digits solvability).
- `*.github.io` is unreachable from the sandbox, so the live site cannot be
  fetched — verify locally and check the Actions tab.

## Ideas not yet built

Export/import of saved progress (survives domain moves), a fourth game,
more themed packs, share cards, real dictionary validation for Word Guess
guesses, Capacitor wrappers for the app stores.
