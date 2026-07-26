/* Word Guess — a Wordle-style daily puzzle. */
(function () {
  "use strict";
  PZ.renderNav("wordle");

  var GAME = "wordle";
  var ROWS = 6, COLS = 5;
  var ANSWERS = window.WORDLE_ANSWERS;

  // Deterministic answer for today: walk the list by puzzle number.
  var puzzleNo = PZ.dayNumber();
  var answer = ANSWERS[((puzzleNo % ANSWERS.length) + ANSWERS.length) % ANSWERS.length].toLowerCase();

  // ----- state -----
  var state = PZ.loadDaily(GAME) || { guesses: [], finished: false, won: false };
  var current = "";

  var boardEl = document.getElementById("board");
  var kbdEl = document.getElementById("kbd");
  var msgEl = document.getElementById("msg");
  document.getElementById("subhead").textContent = "Puzzle #" + puzzleNo + " · six tries";

  /* ---------- scoring ---------- */
  // Returns array of "good" | "warn" | "miss" for each letter of guess.
  function score(guess) {
    var res = new Array(COLS).fill("miss");
    var counts = {};
    var i, c;
    for (i = 0; i < COLS; i++) { c = answer[i]; counts[c] = (counts[c] || 0) + 1; }
    for (i = 0; i < COLS; i++) {
      if (guess[i] === answer[i]) { res[i] = "good"; counts[guess[i]]--; }
    }
    for (i = 0; i < COLS; i++) {
      if (res[i] === "good") continue;
      c = guess[i];
      if (counts[c] > 0) { res[i] = "warn"; counts[c]--; }
    }
    return res;
  }

  /* ---------- rendering ---------- */
  function render() {
    boardEl.innerHTML = "";
    for (var r = 0; r < ROWS; r++) {
      var row = document.createElement("div");
      row.className = "wg-row";
      var guess = state.guesses[r];
      var scored = guess ? score(guess) : null;
      var typing = !state.finished && r === state.guesses.length;
      for (var col = 0; col < COLS; col++) {
        var cell = document.createElement("div");
        cell.className = "wg-cell";
        if (guess) {
          cell.textContent = guess[col];
          cell.classList.add(scored[col]);
        } else if (typing && col < current.length) {
          cell.textContent = current[col];
          cell.classList.add("filled");
        }
        row.appendChild(cell);
      }
      boardEl.appendChild(row);
    }
    renderKeyboard();
  }

  var KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  // Best-known status for each letter across all guesses.
  function keyStatuses() {
    var map = {};
    var rank = { miss: 0, warn: 1, good: 2 };
    state.guesses.forEach(function (g) {
      var sc = score(g);
      for (var i = 0; i < COLS; i++) {
        var c = g[i], s = sc[i];
        if (!map[c] || rank[s] > rank[map[c]]) map[c] = s;
      }
    });
    return map;
  }

  function renderKeyboard() {
    var st = keyStatuses();
    kbdEl.innerHTML = "";
    KEY_ROWS.forEach(function (letters, idx) {
      var row = document.createElement("div");
      row.className = "kbd-row";
      if (idx === 2) row.appendChild(makeKey("enter", "Enter", true));
      letters.split("").forEach(function (c) {
        var k = makeKey(c, c.toUpperCase(), false);
        if (st[c]) k.classList.add(st[c]);
        row.appendChild(k);
      });
      if (idx === 2) row.appendChild(makeKey("back", "⌫", true));
      kbdEl.appendChild(row);
    });
  }

  function makeKey(val, label, wide) {
    var b = document.createElement("button");
    b.className = "key" + (wide ? " wide" : "");
    b.textContent = label;
    b.setAttribute("data-key", val);
    b.addEventListener("click", function () { handleKey(val); });
    return b;
  }

  /* ---------- input ---------- */
  function handleKey(k) {
    if (state.finished) return;
    if (k === "enter") return submit();
    if (k === "back") { current = current.slice(0, -1); render(); return; }
    if (/^[a-z]$/.test(k) && current.length < COLS) {
      current += k;
      render();
    }
  }

  function submit() {
    if (current.length < COLS) { PZ.toast("Not enough letters"); shakeCurrent(); return; }
    var guess = current.toLowerCase();
    if (!/^[a-z]{5}$/.test(guess)) { PZ.toast("Letters only"); return; }

    state.guesses.push(guess);
    current = "";

    if (guess === answer) {
      state.finished = true;
      state.won = true;
      PZ.saveDaily(GAME, state);
      PZ.recordResult(GAME, true, state.guesses.length);
      render();
      var praise = ["Genius!", "Magnificent!", "Impressive!", "Splendid!", "Great!", "Phew!"];
      PZ.toast(praise[state.guesses.length - 1] || "Solved!");
      setTimeout(showStats, 900);
      return;
    }

    if (state.guesses.length >= ROWS) {
      state.finished = true;
      state.won = false;
      PZ.saveDaily(GAME, state);
      PZ.recordResult(GAME, false);
      render();
      PZ.toast(answer.toUpperCase(), 3000);
      setTimeout(showStats, 900);
      return;
    }

    PZ.saveDaily(GAME, state);
    render();
  }

  function shakeCurrent() {
    var rows = boardEl.querySelectorAll(".wg-row");
    var el = rows[state.guesses.length];
    if (!el) return;
    el.querySelectorAll(".wg-cell").forEach(function (c) {
      c.classList.add("shake");
      setTimeout(function () { c.classList.remove("shake"); }, 400);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (document.getElementById("overlay").hidden === false) return;
    if (e.key === "Enter") handleKey("enter");
    else if (e.key === "Backspace") handleKey("back");
    else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toLowerCase());
  });

  /* ---------- stats modal ---------- */
  var countdownTimer = null;
  function showStats() {
    var s = PZ.getStats(GAME);
    var overlay = document.getElementById("overlay");
    var winPct = s.played ? Math.round((s.won / s.played) * 100) : 0;

    document.getElementById("result-line").textContent = state.finished
      ? (state.won ? "You solved it in " + state.guesses.length + "!" : "The word was " + answer.toUpperCase())
      : "";

    document.getElementById("stats-row").innerHTML =
      stat(s.played, "Played") + stat(winPct, "Win %") +
      stat(s.currentStreak, "Streak") + stat(s.maxStreak, "Max");

    var maxCount = 1;
    for (var i = 1; i <= ROWS; i++) maxCount = Math.max(maxCount, s.dist[i] || 0);
    var dist = "";
    for (var g = 1; g <= ROWS; g++) {
      var n = s.dist[g] || 0;
      var pct = Math.round((n / maxCount) * 100);
      var cur = (state.finished && state.won && state.guesses.length === g) ? " cur" : "";
      dist +=
        '<div class="dist-row">' +
          '<span class="lab">' + g + '</span>' +
          '<span class="dist-bar' + cur + '" style="width:' + Math.max(pct, 8) + '%">' + n + '</span>' +
        '</div>';
    }
    document.getElementById("dist").innerHTML = dist;

    overlay.hidden = false;
    clearInterval(countdownTimer);
    countdownTimer = PZ.startCountdown(document.getElementById("countdown"));
  }

  function stat(v, k) {
    return '<div class="stat"><div class="v">' + v + '</div><div class="k">' + k + '</div></div>';
  }

  function shareText() {
    var lines = ["Word Guess #" + puzzleNo + " " +
      (state.won ? state.guesses.length : "X") + "/" + ROWS];
    lines.push("");
    state.guesses.forEach(function (g) {
      lines.push(score(g).map(function (s) {
        return s === "good" ? "🟩" : s === "warn" ? "🟨" : "⬛";
      }).join(""));
    });
    return lines.join("\n");
  }

  document.getElementById("share-btn").addEventListener("click", function () {
    var text = shareText();
    if (navigator.share) {
      navigator.share({ text: text }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () { PZ.toast("Copied to clipboard"); });
    } else {
      PZ.toast("Sharing not supported");
    }
  });
  document.getElementById("close-btn").addEventListener("click", function () {
    document.getElementById("overlay").hidden = true;
    clearInterval(countdownTimer);
  });
  document.getElementById("overlay").addEventListener("click", function (e) {
    if (e.target === this) { this.hidden = true; clearInterval(countdownTimer); }
  });

  /* ---------- boot ---------- */
  render();
  if (state.finished) setTimeout(showStats, 300);
})();
