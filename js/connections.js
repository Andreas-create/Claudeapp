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

  function levelConfig(level) {
    if (level <= 25) return { tiers: [0, 1], mistakes: 5 };
    if (level <= 50) return { tiers: [0, 1, 2], mistakes: 4 };
    if (level <= 75) return { tiers: [1, 2, 3], mistakes: 4 };
    return { tiers: [2, 3], mistakes: 3 };
  }

  // Build the four groups for a level (deterministic, no shared words).
  function buildGroups(level) {
    var cfg = levelConfig(level);
    var rng = PZ.rng("connections:" + level);
    function gather(tiers) { return PZ.shuffle(rng, POOL.filter(function (g) { return tiers.indexOf(g.d) !== -1; })); }
    var candidates = gather(cfg.tiers);
    var chosen = [], used = {};
    function tryAdd(list) {
      for (var i = 0; i < list.length && chosen.length < 4; i++) {
        var g = list[i];
        if (g.words.some(function (w) { return used[w]; })) continue;
        chosen.push(g); g.words.forEach(function (w) { used[w] = true; });
      }
    }
    tryAdd(candidates);
    if (chosen.length < 4) tryAdd(gather([0, 1, 2, 3])); // safety net
    return { groups: chosen, mistakes: cfg.mistakes };
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

    state = {
      solved: [], mistakes: 0, finished: false, won: false,
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
    document.getElementById("hint").textContent = "Make four groups of four · " + maxMistakes + " mistakes allowed";
    document.getElementById("controls").style.display = "";
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
      p.cleared + " / 100 levels cleared · " + PZ.totalStars(GAME) + " ★";
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
    if (won) PZ.markCleared(GAME, level, stars);
    setTimeout(function () {
      PZ.showResult({
        game: GAME, level: level, won: won, stars: stars,
        title: won ? "Level " + level + " complete!" : "Out of tries",
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
    if (lv >= 1 && lv <= PZ.LEVELS && lv !== level && PZ.isUnlocked(GAME, lv)) startLevel(lv);
    else if (!lv && !playEl.hidden) showSelect();
  });

  /* ---------- boot ---------- */
  (function boot() {
    var lv = parseInt(location.hash.slice(1), 10);
    if (lv >= 1 && lv <= PZ.LEVELS && PZ.isUnlocked(GAME, lv)) startLevel(lv);
    else showSelect();
  })();
})();
