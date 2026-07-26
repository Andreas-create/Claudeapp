/* Peru Connections pack — 5 fixed, high-difficulty puzzles, all playable
   independently. Reuses the same grouping mechanic as the main Connections
   game but reads hand-authored puzzles from PERU_PUZZLES. */
(function () {
  "use strict";
  PZ.renderNav("peru");

  var GAME = "peru";
  var PUZZLES = window.PERU_PUZZLES;
  var MAXLV = PUZZLES.length;
  var MISTAKES = 4;

  var selectEl = document.getElementById("select");
  var playEl = document.getElementById("play");
  var gridEl = document.getElementById("cgrid");
  var solvedEl = document.getElementById("solved");
  var dotsEl = document.getElementById("dots");
  var submitBtn = document.getElementById("submit-btn");

  // ----- active puzzle state -----
  var level = 0, groups = [], colorIndex = [], wordToGroup = {};
  var state = null, selection = [];

  function startLevel(lv) {
    level = lv;
    var puzzle = PUZZLES[lv - 1];
    groups = puzzle.groups;

    // display colours 0..3 by ascending difficulty
    var order = groups.map(function (_, i) { return i; })
      .sort(function (a, b) { return groups[a].d - groups[b].d || a - b; });
    colorIndex = [];
    order.forEach(function (gi, pos) { colorIndex[gi] = pos; });

    wordToGroup = {};
    var allWords = [];
    groups.forEach(function (g, gi) { g.words.forEach(function (w) { wordToGroup[w] = gi; allWords.push(w); }); });

    state = {
      solved: [], mistakes: 0, finished: false, won: false,
      order: PZ.shuffle(PZ.rng("peru:order:" + lv), allWords)
    };
    selection = [];
    PZ.hideResult();

    selectEl.hidden = true;
    playEl.hidden = false;
    PZ.renderPlayNav(document.getElementById("playnav"), {
      game: GAME, level: lv, max: MAXLV, allOpen: true,
      label: "Puzzle " + lv + " · " + puzzle.title,
      onGoto: startLevel, onLevels: showSelect
    });
    document.getElementById("hint").textContent = "Make four groups of four · " + MISTAKES + " mistakes allowed";
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
      p.cleared + " / " + MAXLV + " solved · " + PZ.totalStars(GAME) + " ★";
    PZ.renderLevelGrid(document.getElementById("grid"), GAME, startLevel, MAXLV, true);
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
    for (var i = 0; i < MISTAKES; i++) {
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
    if (idxs.every(function (t) { return t === first; })) {
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
    if (state.mistakes >= MISTAKES) {
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
        game: GAME, level: level, max: MAXLV, won: won, stars: stars,
        finalMsg: "You finished the Peru pack! 🇵🇪",
        title: won ? "Puzzle " + level + " solved!" : "Out of tries",
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
    state.order = PZ.shuffle(PZ.rng("peru:reshuffle:" + Date.now()), state.order); render();
  });
  window.addEventListener("hashchange", function () {
    var lv = parseInt(location.hash.slice(1), 10);
    if (lv >= 1 && lv <= MAXLV && lv !== level) startLevel(lv);
    else if (!lv && !playEl.hidden) showSelect();
  });

  /* ---------- boot ---------- */
  (function boot() {
    var lv = parseInt(location.hash.slice(1), 10);
    if (lv >= 1 && lv <= MAXLV) startLevel(lv);
    else showSelect();
  })();
})();
