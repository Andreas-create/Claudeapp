/* Connections — 100 levels. Difficulty rises via the tier window the four
   groups are drawn from (recognisable categories -> tricky wordplay) and
   the number of mistakes allowed. Gameplay lives in cn-engine.js. */
(function () {
  "use strict";
  PZ.renderNav("connections");

  var POOL = window.CONNECTIONS_GROUPS;
  var MAX = 200;  // levels in the ladder
  var GAP = 100;  // minimum levels between reuse of any category

  // Every level mixes 1 green + 2 blue + 1 purple; the pool per tier is
  // sized so the scheduler can keep any category 100+ levels from its
  // reuse (each category appears at most twice across the ladder).
  // Difficulty ramps through the mistake allowance instead.
  function composition() { return { 1: 1, 2: 2, 3: 1 }; }
  function mistakesFor(level) { return level <= 70 ? 4 : level <= 140 ? 3 : 2; }

  // Assign four groups to every level, deterministically. A least-recently-
  // used picker enforces that no category repeats within GAP levels (falling
  // back to the oldest-used group only if the pool can't satisfy it).
  var ASSIGN = null;
  function assignments() {
    if (ASSIGN) return ASSIGN;
    ASSIGN = {};
    var byTier = { 1: [], 2: [], 3: [] };
    POOL.forEach(function (g) { if (byTier[g.d]) byTier[g.d].push(g); });
    [1, 2, 3].forEach(function (t) { byTier[t] = PZ.shuffle(PZ.rng("cn:pool:" + t), byTier[t]); });
    var lastUsed = {}; // category -> last level it appeared on

    // Oldest-used non-clashing group in the tier; when honorGap, skip
    // groups seen within the last GAP levels.
    function scan(deck, level, used, honorGap) {
      var best = null, bestLast = Infinity;
      for (var i = 0; i < deck.length; i++) {
        var g = deck[i];
        if (g.words.some(function (w) { return used[w]; })) continue;
        var lu = lastUsed[g.cat];
        if (honorGap && lu !== undefined && level - lu <= GAP) continue;
        var v = (lu === undefined) ? -1 : lu;
        if (v < bestLast) { bestLast = v; best = g; }
      }
      return best;
    }
    function pick(tier, level, used) {
      var deck = byTier[tier];
      return scan(deck, level, used, true) || scan(deck, level, used, false) || deck[0];
    }

    for (var level = 1; level <= MAX; level++) {
      var c = composition(level), chosen = [], used = {};
      [1, 2, 3].forEach(function (t) {
        for (var i = 0; i < c[t]; i++) {
          var g = pick(t, level, used);
          chosen.push(g);
          g.words.forEach(function (w) { used[w] = true; });
          lastUsed[g.cat] = level;
        }
      });
      ASSIGN[level] = chosen;
    }
    return ASSIGN;
  }

  PZ.connectionsGame({
    game: "connections",
    maxLevels: MAX,
    allOpen: false,
    seedPrefix: "cn",
    buildLevel: function (lv) {
      return {
        groups: assignments()[lv].slice(),
        mistakes: mistakesFor(lv),
        label: "Level " + lv
      };
    },
    progressLine: function () {
      return PZ.wonCount("connections") + " / " + MAX + " solved · " + PZ.totalStars("connections") + " ★";
    }
  });
})();
