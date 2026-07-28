# Play Store listing — Brainbow

Draft copy and the values you need on hand. Not shipped to the site; kept in
the repo so the listing and the app stay in step.

---

## App name (30 char max)

```
Brainbow
```
*8 chars. Check it is free on Play before committing — the store rejects
duplicates of an existing app name in some cases, and "Brainbow" is also a
neuroscience imaging term, so search first.*

## Short description (80 char max)

```
Word, logic and number puzzles. 600+ levels, plays offline, no ads.
```
*67 chars. Leads with what it is, then the two things that actually
differentiate it: works offline, and no advertising.*

Alternatives if you want a different emphasis:

```
Three puzzle games, 600+ levels. No ads, no accounts, works offline.
```
*68 chars.*

```
Daily-style brain puzzles with a little sparkle. 600+ levels, all offline.
```
*74 chars.*

## Full description (4000 char max)

```
Brainbow is three puzzle games in one app, with over 600 hand-tuned levels
that get harder as you go. No ads. No accounts. No internet needed.

🔤 WORD GUESS
Guess the hidden word from its letters. Words start at four letters and grow
to seven, and the guesses you are allowed shrink as you climb. Every one of
the 200 levels has its own answer — no repeats, ever.

🔗 AFFINITY
Sixteen words, four hidden groups of four. Sounds easy until you notice the
words that would fit in two groups at once. Stuck? Two hints per puzzle will
explain any word on the board — and because every definition ships inside the
app, hints work even with no signal.

🔢 CRUNCH
Combine the numbers with + − × ÷ to hit the target. Every level is built
backwards from a real solution, so there is always a way through. Later levels
bring bigger numbers and much bigger targets.

🇵🇪 THEMED PACKS
Ten hand-written Affinity puzzles on Peru — its history, food, geography, arts
and wildlife. More packs to come.

── WHY YOU MIGHT LIKE IT ──

• Genuinely offline. Install it once and every puzzle keeps working on a plane,
  on the underground, or anywhere with no signal.
• No ads, no pop-ups, no "watch a video to continue", nothing to buy.
• No account and no sign-in. Your progress is saved on your device and stays
  there — we never see it.
• 600+ levels across the three games, plus themed packs.
• Earn up to three stars a level. Clear one to unlock the next.
• Light and dark themes, following your phone.
• Warm, playful and a little camp — the wins and losses have opinions.

── A NOTE ON DIFFICULTY ──

Levels unlock in order and get steadily harder. Lose one and it stays lost —
you can reopen it to see the answer, but not replay it. The next level unlocks
either way, so you are never stuck.

Brainbow is free, contains no advertising, and collects no personal
information. It is a small independent project, not a service.
```
*~1,750 characters. Well inside the limit, with room to add packs later.*

---

## Values you need on hand

| Field | Value |
|---|---|
| Category | Games → Puzzle |
| Tags | Puzzle, Word, Brain games |
| Content rating | Everyone (no violence, no UGC, no purchases) |
| Contains ads | **No** |
| In-app purchases | **No** |
| Privacy policy URL | `https://brainbow-puzzle.github.io/privacy.html` |
| Support email | `brainbow.puzzle@gmail.com` — **does not exist yet, create it** |
| Website | `https://brainbow-puzzle.github.io` |
| App icon | `icons/icon-512.png` (512×512) ✅ |
| Feature graphic | 1024×500 ✅ generated |
| Phone screenshots | 6 × 1080×1920 ✅ generated |

## Data Safety form

Answer it to match `privacy.html` exactly — a mismatch is grounds for removal
later, which is worse than a rejection now.

- **Does your app collect or share any of the required user data types?**
  → Yes. Cloudflare Web Analytics collects **App interactions** (page views)
  and approximate **Device or other IDs**-free diagnostics.
- Data is **not** linked to a user's identity.
- Data is **not** used to track users across apps or websites.
- Data **is** processed by a third party (Cloudflare) as a service provider.
- Data collection is **not** optional — but no personal data is collected.
- **Is data encrypted in transit?** Yes (HTTPS).
- **Can users request deletion?** There is nothing personal to delete;
  clearing site data removes all local progress.

*If you would rather answer "no collection at all", the only honest route is
to blank `CF_BEACON_TOKEN` in `js/common.js` and ship without analytics.*

## Still to decide before you build

1. **Final domain.** A TWA hardcodes its origin. Settle this before the first
   release — see `.well-known/README.md`.
2. **Package name.** Permanent after the first release. Placeholder is
   `io.github.brainbow_puzzle.twa`.
3. **The 12-tester rule.** A personal developer account needs 12 testers opted
   into a closed test for 14 continuous days before you can apply for
   production. Line these up early; it is the long pole.
