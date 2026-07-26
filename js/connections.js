/* Connections — sort 16 words into four hidden groups of four. */
(function () {
  "use strict";
  PZ.renderNav("connections");

  var GAME = "connections";
  var MAX_MISTAKES = 4;
  var POOL = window.CONNECTIONS_GROUPS;
  var puzzleNo = PZ.dayNumber();
  document.getElementById("subhead").textContent = "Puzzle #" + puzzleNo + " · four mistakes allowed";

  /* ---------- build today's puzzle ---------- */
  // One group per difficulty tier, with no word shared across groups.
  function buildPuzzle() {
    var rng = PZ.rng("connections:" + puzzleNo);
    var chosen = [];
    var used = {};
    for (var tier = 0; tier < 4; tier++) {
      var candidates = PZ.shuffle(rng, POOL.filter(function (g) { return g.d === tier; }));
      var picked = null;
      for (var i = 0; i < candidates.length; i++) {
        var g = candidates[i];
        var clash = g.words.some(function (w) { return used[w]; });
        if (!clash) { picked = g; break; }
      }
      if (!picked) picked = candidates[0]; // extremely unlikely fallback
      picked.words.forEach(function (w) { used[w] = true; });
      chosen.push(picked);
    }
    return chosen;
  }

  var groups = buildPuzzle(); // index 0..3 == difficulty tier
  var wordToGroup = {};
  groups.forEach(function (g, gi) {
    g.words.forEach(function (w) { wordToGroup[w] = gi; });
  });
  var allWords = groups.reduce(function (acc, g) { return acc.concat(g.words); }, []);

  /* ---------- state ---------- */
  var state = PZ.loadDaily(GAME) || {
    solvedTiers: [],     // difficulty indices already found
    mistakes: 0,
    order: PZ.shuffle(PZ.rng("connections:order:" + puzzleNo), allWords),
    history: [],         // each guess: array of tier-colors for share grid
    finished: false,
    won: false
  };
  var selection = [];

  var gridEl = document.getElementById("grid");
  var solvedEl = document.getElementById("solved");
  var dotsEl = document.getElementById("dots");
  var msgEl = document.getElementById("msg");
  var submitBtn = document.getElementById("submit-btn");

  function remainingWords() {
    return state.order.filter(function (w) {
      return state.solvedTiers.indexOf(wordToGroup[w]) === -1;
    });
  }

  /* ---------- rendering ---------- */
  function render() {
    // solved bands
    solvedEl.innerHTML = state.solvedTiers.map(function (tier) {
      var g = groups[tier];
      return '<div class="cn-group cn-d' + tier + '">' +
        '<div class="cat">' + g.cat + '</div>' +
        '<div class="members">' + g.words.join(", ") + '</div></div>';
    }).join("");

    // grid of remaining words
    gridEl.innerHTML = "";
    remainingWords().forEach(function (w) {
      var b = document.createElement("button");
      b.className = "cn-tile" + (selection.indexOf(w) !== -1 ? " sel" : "");
      b.textContent = w;
      b.disabled = state.finished;
      b.addEventListener("click", function () { toggle(w); });
      gridEl.appendChild(b);
    });

    // mistake dots
    dotsEl.innerHTML = "";
    for (var i = 0; i < MAX_MISTAKES; i++) {
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

    var tiers = selection.map(function (w) { return wordToGroup[w]; });
    state.history.push(tiers.slice());

    // all same group?
    var first = tiers[0];
    var allSame = tiers.every(function (t) { return t === first; });

    if (allSame) {
      state.solvedTiers.push(first);
      selection = [];
      PZ.saveDaily(GAME, state);
      if (state.solvedTiers.length === 4) finish(true);
      else render();
      return;
    }

    // "one away" check: 3 of 4 share a group
    var counts = {};
    tiers.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
    var oneAway = Object.keys(counts).some(function (k) { return counts[k] === 3; });

    state.mistakes += 1;
    shakeSelection();
    PZ.toast(oneAway ? "One away…" : "Not a group");
    PZ.saveDaily(GAME, state);

    if (state.mistakes >= MAX_MISTAKES) {
      // reveal everything as lost
      groups.forEach(function (_, tier) {
        if (state.solvedTiers.indexOf(tier) === -1) state.solvedTiers.push(tier);
      });
      finish(false);
    } else {
      render();
    }
  }

  function shakeSelection() {
    gridEl.querySelectorAll(".cn-tile.sel").forEach(function (el) {
      el.classList.add("shake");
      setTimeout(function () { el.classList.remove("shake"); }, 400);
    });
  }

  function finish(won) {
    state.finished = true;
    state.won = won;
    selection = [];
    // Order solved bands by difficulty for a clean final board.
    state.solvedTiers.sort(function (a, b) { return a - b; });
    PZ.saveDaily(GAME, state);
    PZ.recordResult(GAME, won);
    render();
    document.getElementById("controls").style.display = "none";
    setTimeout(showStats, 700);
  }

  /* ---------- controls ---------- */
  document.getElementById("submit-btn").addEventListener("click", submit);
  document.getElementById("deselect-btn").addEventListener("click", function () {
    selection = []; render();
  });
  document.getElementById("shuffle-btn").addEventListener("click", function () {
    state.order = PZ.shuffle(PZ.rng("cn:reshuffle:" + Date.now()), state.order);
    render();
  });

  /* ---------- stats modal ---------- */
  var countdownTimer = null;
  function showStats() {
    var s = PZ.getStats(GAME);
    var winPct = s.played ? Math.round((s.won / s.played) * 100) : 0;
    document.getElementById("result-line").textContent =
      state.won ? "Solved with " + state.mistakes + " mistake" + (state.mistakes === 1 ? "" : "s")
                : "Better luck tomorrow!";
    document.getElementById("stats-row").innerHTML =
      stat(s.played, "Played") + stat(winPct, "Win %") +
      stat(s.currentStreak, "Streak") + stat(s.maxStreak, "Max");
    document.getElementById("overlay").hidden = false;
    clearInterval(countdownTimer);
    countdownTimer = PZ.startCountdown(document.getElementById("countdown"));
  }
  function stat(v, k) {
    return '<div class="stat"><div class="v">' + v + '</div><div class="k">' + k + '</div></div>';
  }

  var SQUARES = ["🟨", "🟩", "🟦", "🟪"];
  function shareText() {
    var head = "Connections #" + puzzleNo + (state.won ? "" : " (X)");
    var rows = state.history.map(function (tiers) {
      return tiers.map(function (t) { return SQUARES[t]; }).join("");
    });
    return [head, ""].concat(rows).join("\n");
  }

  document.getElementById("share-btn").addEventListener("click", function () {
    var text = shareText();
    if (navigator.share) navigator.share({ text: text }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { PZ.toast("Copied to clipboard"); });
    else PZ.toast("Sharing not supported");
  });
  document.getElementById("close-btn").addEventListener("click", function () {
    document.getElementById("overlay").hidden = true; clearInterval(countdownTimer);
  });
  document.getElementById("overlay").addEventListener("click", function (e) {
    if (e.target === this) { this.hidden = true; clearInterval(countdownTimer); }
  });

  /* ---------- boot ---------- */
  if (state.finished) {
    document.getElementById("controls").style.display = "none";
    render();
    setTimeout(showStats, 300);
  } else {
    render();
  }
})();
