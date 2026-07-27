/* Shared Connections gameplay engine.
   Drives both the 100-level Connections game and themed packs (Peru):
   same DOM (#cgrid/#solved/#dots/#controls/#playnav/#hint-panel), same
   rules — 4 groups of 4, limited mistakes, one-shot losses with read-only
   review, 2 hints per puzzle.

   PZ.connectionsGame(cfg) with:
     game        storage id ("connections", "peru")
     maxLevels   number of levels
     allOpen     true when every level is playable in any order (packs)
     seedPrefix  seed namespace for shuffles
     buildLevel(lv) -> { groups, mistakes, label }
     progressLine() -> text for the level-select header
     finalMsg    (optional) result-screen message on the last level */
(function () {
  "use strict";

  window.PZ.connectionsGame = function (cfg) {
    var PZ = window.PZ;
    var GAME = cfg.game;

    var selectEl = document.getElementById("select");
    var playEl = document.getElementById("play");
    var gridEl = document.getElementById("cgrid");
    var solvedEl = document.getElementById("solved");
    var dotsEl = document.getElementById("dots");
    var submitBtn = document.getElementById("submit-btn");

    // ----- active level state -----
    var level = 0, groups = [], colorIndex = [], wordToGroup = {}, maxMistakes = 4;
    var state = null, selection = [];

    var hints = PZ.setupHints({
      getSelectedWord: function () {
        if (!state || state.finished) return null;
        return selection.length === 1 ? selection[0] : null;
      }
    });

    function startLevel(lv) {
      level = lv;
      var built = cfg.buildLevel(lv);
      groups = built.groups;
      maxMistakes = built.mistakes;

      // Display colors 0..3 by ascending real difficulty.
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
        order: PZ.shuffle(PZ.rng(cfg.seedPrefix + ":order:" + lv), allWords)
      };
      selection = [];
      PZ.hideResult();

      selectEl.hidden = true;
      playEl.hidden = false;
      PZ.renderPlayNav(document.getElementById("playnav"), {
        game: GAME, level: lv, max: cfg.maxLevels, allOpen: cfg.allOpen,
        label: built.label,
        onGoto: startLevel, onLevels: showSelect
      });
      document.getElementById("hint").textContent = review
        ? "Review — you didn't solve this one"
        : "Make four groups of four · " + maxMistakes + " mistakes allowed";
      document.getElementById("controls").style.display = review ? "none" : "";
      hints.reset();
      location.hash = "" + lv;
      render();
    }

    function showSelect() {
      playEl.hidden = true;
      selectEl.hidden = false;
      PZ.hideResult();
      if (location.hash) history.replaceState(null, "", location.pathname);
      document.getElementById("progress-line").textContent = cfg.progressLine();
      PZ.renderLevelGrid(document.getElementById("grid"), GAME, startLevel, cfg.maxLevels, cfg.allOpen);
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
          game: GAME, level: level, max: cfg.maxLevels, won: won, stars: stars,
          finalMsg: cfg.finalMsg,
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
      state.order = PZ.shuffle(PZ.rng(cfg.seedPrefix + ":reshuffle:" + Date.now()), state.order); render();
    });
    window.addEventListener("hashchange", function () {
      var lv = parseInt(location.hash.slice(1), 10);
      if (lv >= 1 && lv <= cfg.maxLevels && lv !== level && PZ.canOpen(GAME, lv, cfg.allOpen)) startLevel(lv);
      else if (!lv && !playEl.hidden) showSelect();
    });

    /* ---------- boot ---------- */
    var lv = parseInt(location.hash.slice(1), 10);
    if (lv >= 1 && lv <= cfg.maxLevels && PZ.canOpen(GAME, lv, cfg.allOpen)) startLevel(lv);
    else showSelect();
  };
})();
