/* Connections — 100 levels. Difficulty rises via the tier window the four
   groups are drawn from (easy distinct categories -> tricky wordplay) and
   the number of mistakes allowed. */
(function () {
  "use strict";
  PZ.renderNav("connections");

  var GAME = "connections";
  var POOL = window.CONNECTIONS_GROUPS;

  var selectEl = document.getElementById("select");
  var playEl = document.getElementById("play");
  var gridEl = document.getElementById("cgrid");
  var solvedEl = document.getElementById("solved");
  var dotsEl = document.getElementById("dots");
  var submitBtn = document.getElementById("submit-btn");

  // Difficulty ramp: how many of the four groups come from each tier.
  // Starts green+blue and climbs to blue+purple; capped at 2 per tier so
  // the pool is large enough to keep categories 20+ levels apart.
  function composition(level) {
    if (level <= 25) return { 1: 2, 2: 2, 3: 0 };
    if (level <= 50) return { 1: 1, 2: 2, 3: 1 };
    if (level <= 75) return { 1: 0, 2: 2, 3: 2 };
    return { 1: 0, 2: 2, 3: 2 };
  }
  function mistakesFor(level) { return level <= 40 ? 4 : level <= 80 ? 3 : 2; }

  var GAP = 20; // minimum levels between reuse of any category

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

    function pick(tier, level, used) {
      var deck = byTier[tier], best = null, bestLast = Infinity, i, g, lu;
      // prefer a group not used within GAP levels, choosing the oldest
      for (i = 0; i < deck.length; i++) {
        g = deck[i];
        if (g.words.some(function (w) { return used[w]; })) continue;
        lu = lastUsed[g.cat];
        if (lu !== undefined && level - lu <= GAP) continue;
        var v = (lu === undefined) ? -1 : lu;
        if (v < bestLast) { bestLast = v; best = g; }
      }
      if (best) return best;
      // fallback: oldest non-clashing group regardless of GAP
      for (i = 0; i < deck.length; i++) {
        g = deck[i];
        if (g.words.some(function (w) { return used[w]; })) continue;
        lu = lastUsed[g.cat]; var v2 = (lu === undefined) ? -1 : lu;
        if (v2 < bestLast) { bestLast = v2; best = g; }
      }
      return best || deck[0];
    }

    for (var level = 1; level <= PZ.LEVELS; level++) {
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

  function buildGroups(level) {
    return { groups: assignments()[level].slice(), mistakes: mistakesFor(level) };
  }

  // ----- active level state -----
  var level = 0, groups = [], colorIndex = [], wordToGroup = {}, maxMistakes = 5;
  var state = null, selection = [];

  function startLevel(lv) {
    level = lv;
    var built = buildGroups(lv);
    groups = built.groups;
    maxMistakes = built.mistakes;

    // Assign display colors 0..3 by ascending real difficulty.
    var order = groups.map(function (_, i) { return i; })
      .sort(function (a, b) { return groups[a].d - groups[b].d || a - b; });
    colorIndex = [];
    order.forEach(function (gi, pos) { colorIndex[gi] = pos; });

    wordToGroup = {};
    var allWords = [];
    groups.forEach(function (g, gi) { g.words.forEach(function (w) { wordToGroup[w] = gi; allWords.push(w); }); });

    var review = PZ.isLost(GAME, lv); // lost levels open read-only for review
    state = {
      solved: review ? groups.map(function (_, i) { return i; }) : [],
      mistakes: 0, finished: review, won: false, review: review,
      order: PZ.shuffle(PZ.rng("cn:order:" + lv), allWords)
    };
    selection = [];
    PZ.hideResult();

    selectEl.hidden = true;
    playEl.hidden = false;
    PZ.renderPlayNav(document.getElementById("playnav"), {
      game: GAME, level: lv, label: "Level " + lv,
      onGoto: startLevel, onLevels: showSelect
    });
    document.getElementById("hint").textContent = review
      ? "Review — you didn't solve this one"
      : "Make four groups of four · " + maxMistakes + " mistakes allowed";
    document.getElementById("controls").style.display = review ? "none" : "";
    location.hash = "" + lv;
    render();
  }

  function showSelect() {
    playEl.hidden = true;
    selectEl.hidden = false;
    PZ.hideResult();
    if (location.hash) history.replaceState(null, "", location.pathname);
    var p = PZ.getProgress(GAME);
    document.getElementById("progress-line").textContent =
      PZ.wonCount(GAME) + " / 100 solved · " + PZ.totalStars(GAME) + " ★";
    PZ.renderLevelGrid(document.getElementById("grid"), GAME, function (lv) { startLevel(lv); });
  }

  function remainingWords() {
    return state.order.filter(function (w) { return state.solved.indexOf(wordToGroup[w]) === -1; });
  }

  /* ---------- rendering ---------- */
  function render() {
    var solvedSorted = state.solved.slice().sort(function (a, b) { return colorIndex[a] - colorIndex[b]; });
    solvedEl.innerHTML = solvedSorted.map(function (gi) {
      var g = groups[gi];
      return '<div class="cn-group cn-d' + colorIndex[gi] + '">' +
        '<div class="cat">' + g.cat + '</div>' +
        '<div class="members">' + g.words.join(", ") + '</div></div>';
    }).join("");

    gridEl.innerHTML = "";
    remainingWords().forEach(function (w) {
      var b = document.createElement("button");
      b.className = "cn-tile" + (selection.indexOf(w) !== -1 ? " sel" : "");
      b.textContent = w;
      b.disabled = state.finished;
      b.addEventListener("click", function () { toggle(w); });
      gridEl.appendChild(b);
    });

    dotsEl.innerHTML = "";
    for (var i = 0; i < maxMistakes; i++) {
      var d = document.createElement("div");
      d.className = "cn-dot" + (i < state.mistakes ? " used" : "");
      dotsEl.appendChild(d);
    }
    submitBtn.disabled = state.finished || selection.length !== 4;
  }

  function toggle(w) {
    if (state.finished) return;
    var i = selection.indexOf(w);
    if (i !== -1) selection.splice(i, 1);
    else if (selection.length < 4) selection.push(w);
    render();
  }

  /* ---------- guessing ---------- */
  function submit() {
    if (selection.length !== 4 || state.finished) return;
    var idxs = selection.map(function (w) { return wordToGroup[w]; });
    var first = idxs[0];
    var allSame = idxs.every(function (t) { return t === first; });

    if (allSame) {
      state.solved.push(first);
      selection = [];
      if (state.solved.length === 4) return finish(true);
      render();
      return;
    }

    var counts = {};
    idxs.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
    var oneAway = Object.keys(counts).some(function (k) { return counts[k] === 3; });
    state.mistakes += 1;
    shakeSelection();
    PZ.toast(oneAway ? "One away…" : "Not a group");

    if (state.mistakes >= maxMistakes) {
      groups.forEach(function (_, gi) { if (state.solved.indexOf(gi) === -1) state.solved.push(gi); });
      finish(false);
    } else {
      render();
    }
  }

  function shakeSelection() {
    gridEl.querySelectorAll(".cn-tile.sel").forEach(function (el) {
      el.classList.add("shake"); setTimeout(function () { el.classList.remove("shake"); }, 400);
    });
  }

  function finish(won) {
    state.finished = true; state.won = won;
    selection = [];
    render();
    document.getElementById("controls").style.display = "none";
    var stars = won ? (state.mistakes === 0 ? 3 : state.mistakes <= 2 ? 2 : 1) : 0;
    PZ.markResult(GAME, level, won, stars);
    var phrase = won ? PZ.praise() : PZ.sashay();
    PZ.toast(phrase, won ? 1600 : 2400);
    setTimeout(function () {
      PZ.showResult({
        game: GAME, level: level, won: won, stars: stars,
        title: phrase,
        detail: won
          ? "Solved with " + state.mistakes + " mistake" + (state.mistakes === 1 ? "" : "s")
          : "Groups revealed above",
        onNext: function () { startLevel(level + 1); },
        onRetry: function () { startLevel(level); },
        onLevels: showSelect
      });
    }, 700);
  }

  /* ---------- controls ---------- */
  submitBtn.addEventListener("click", submit);
  document.getElementById("deselect-btn").addEventListener("click", function () { selection = []; render(); });
  document.getElementById("shuffle-btn").addEventListener("click", function () {
    state.order = PZ.shuffle(PZ.rng("cn:reshuffle:" + Date.now()), state.order); render();
  });
  window.addEventListener("hashchange", function () {
    var lv = parseInt(location.hash.slice(1), 10);
    if (lv >= 1 && lv <= PZ.LEVELS && lv !== level && PZ.canOpen(GAME, lv)) startLevel(lv);
    else if (!lv && !playEl.hidden) showSelect();
  });

  /* ---------- boot ---------- */
  (function boot() {
    var lv = parseInt(location.hash.slice(1), 10);
    if (lv >= 1 && lv <= PZ.LEVELS && PZ.canOpen(GAME, lv)) startLevel(lv);
    else showSelect();
  })();
})();
