/* Word Guess — 200 levels of Wordle-style word guessing.
   Difficulty ramps by word length (4 -> 5 -> 6 -> 7 letters) and by the
   guess allowance, which tightens to 5 then 4 tries near the top.
   Every level uses a distinct answer; words run common -> obscure. */
(function () {
  "use strict";
  PZ.renderNav("wordle");

  var GAME = "wordle";
  var MAX = 200;
  var BANDS = window.WORDLE_BANDS;
  var ROWS = 6; // guesses allowed for the active level (tightens late on)

  var selectEl = document.getElementById("select");
  var playEl = document.getElementById("play");
  var boardEl = document.getElementById("board");
  var kbdEl = document.getElementById("kbd");
  var msgEl = document.getElementById("msg");

  // ----- per-level config -----
  // Word length grows with the level, and the guess allowance shrinks near
  // the top: six tries through level 150, then five, then four for 191-200.
  function levelConfig(level) {
    var band, idx;
    if (level <= 50) { band = "four"; idx = level - 1; }
    else if (level <= 120) { band = "five"; idx = level - 51; }
    else if (level <= 175) { band = "six"; idx = level - 121; }
    else { band = "seven"; idx = level - 176; }
    var list = BANDS[band];
    var word = list[idx % list.length].toLowerCase();
    var rows = level <= 150 ? 6 : level <= 190 ? 5 : 4;
    return { word: word, cols: word.length, rows: rows };
  }

  // ----- game state (per active level) -----
  var level = 0, answer = "", COLS = 0;
  var state = null, current = "";

  function startLevel(lv) {
    level = lv;
    var cfg = levelConfig(lv);
    answer = cfg.word;
    COLS = cfg.cols;
    ROWS = cfg.rows;
    var review = PZ.isLost(GAME, lv); // lost levels open read-only for review
    state = { guesses: [], finished: review, won: false, review: review };
    current = "";
    PZ.hideResult();

    selectEl.hidden = true;
    playEl.hidden = false;
    PZ.renderPlayNav(document.getElementById("playnav"), {
      game: GAME, level: lv, max: MAX,
      label: "Level " + lv + " · " + COLS + " letters · " + ROWS + " tries",
      onGoto: startLevel, onLevels: showSelect
    });
    location.hash = "" + lv;
    if (review) { renderReview(); } else { msgEl.textContent = ""; render(); }
  }

  // Read-only view of a lost level: reveal the answer, no keyboard.
  function renderReview() {
    boardEl.style.setProperty("--cols", COLS);
    boardEl.innerHTML = "";
    var row = document.createElement("div");
    row.className = "wg-row";
    row.style.gridTemplateColumns = "repeat(" + COLS + ", var(--cell))";
    for (var i = 0; i < COLS; i++) {
      var cell = document.createElement("div");
      cell.className = "wg-cell reveal";
      cell.textContent = answer[i];
      row.appendChild(cell);
    }
    boardEl.appendChild(row);
    kbdEl.innerHTML = "";
    msgEl.textContent = "Review — you didn't solve this. The word was " + answer.toUpperCase();
  }

  function showSelect() {
    playEl.hidden = true;
    selectEl.hidden = false;
    PZ.hideResult();
    if (location.hash) history.replaceState(null, "", location.pathname);
    renderSelect();
  }

  function renderSelect() {
    var p = PZ.getProgress(GAME);
    document.getElementById("progress-line").textContent =
      PZ.wonCount(GAME) + " / " + MAX + " solved · " + PZ.totalStars(GAME) + " ★";
    PZ.renderLevelGrid(document.getElementById("grid"), GAME, function (lv) { startLevel(lv); }, MAX);
  }

  /* ---------- scoring ---------- */
  function score(guess) {
    var res = new Array(COLS).fill("miss");
    var counts = {}, i, c;
    for (i = 0; i < COLS; i++) { c = answer[i]; counts[c] = (counts[c] || 0) + 1; }
    for (i = 0; i < COLS; i++) if (guess[i] === answer[i]) { res[i] = "good"; counts[guess[i]]--; }
    for (i = 0; i < COLS; i++) {
      if (res[i] === "good") continue;
      c = guess[i];
      if (counts[c] > 0) { res[i] = "warn"; counts[c]--; }
    }
    return res;
  }

  /* ---------- rendering ---------- */
  function render() {
    boardEl.style.setProperty("--cols", COLS);
    boardEl.innerHTML = "";
    for (var r = 0; r < ROWS; r++) {
      var row = document.createElement("div");
      row.className = "wg-row";
      row.style.gridTemplateColumns = "repeat(" + COLS + ", var(--cell))";
      var guess = state.guesses[r];
      var scored = guess ? score(guess) : null;
      var typing = !state.finished && r === state.guesses.length;
      for (var col = 0; col < COLS; col++) {
        var cell = document.createElement("div");
        cell.className = "wg-cell";
        if (guess) { cell.textContent = guess[col]; cell.classList.add(scored[col]); }
        else if (typing && col < current.length) { cell.textContent = current[col]; cell.classList.add("filled"); }
        row.appendChild(cell);
      }
      boardEl.appendChild(row);
    }
    renderKeyboard();
  }

  var KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  function keyStatuses() {
    var map = {}, rank = { miss: 0, warn: 1, good: 2 };
    state.guesses.forEach(function (g) {
      var sc = score(g);
      for (var i = 0; i < COLS; i++) { var c = g[i], s = sc[i]; if (!map[c] || rank[s] > rank[map[c]]) map[c] = s; }
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
    b.addEventListener("click", function () { handleKey(val); });
    return b;
  }

  /* ---------- input ---------- */
  function handleKey(k) {
    if (!state || state.finished) return;
    if (k === "enter") return submit();
    if (k === "back") { current = current.slice(0, -1); render(); return; }
    if (/^[a-z]$/.test(k) && current.length < COLS) { current += k; render(); }
  }

  function submit() {
    if (current.length < COLS) { PZ.toast("Not enough letters"); shakeCurrent(); return; }
    var guess = current.toLowerCase();
    state.guesses.push(guess);
    current = "";

    if (guess === answer) {
      state.finished = true; state.won = true;
      var n = state.guesses.length;
      var stars = n <= Math.ceil(ROWS / 2) ? 3 : n <= ROWS - 1 ? 2 : 1;
      PZ.markCleared(GAME, level, stars);
      render();
      var phrase = PZ.praise();
      PZ.toast(phrase);
      finishResult(true, stars, "Solved in " + n + " " + (n === 1 ? "try" : "tries"), phrase);
      return;
    }
    if (state.guesses.length >= ROWS) {
      state.finished = true; state.won = false;
      PZ.markResult(GAME, level, false, 0);
      render();
      var sp = PZ.sashay();
      PZ.toast(sp, 2400);
      finishResult(false, 0, "The word was " + answer.toUpperCase(), sp);
      return;
    }
    render();
  }

  function finishResult(won, stars, detail, title) {
    setTimeout(function () {
      PZ.showResult({
        game: GAME, level: level, max: MAX, won: won, stars: stars,
        title: title || (won ? "Level " + level + " complete!" : "Out of guesses"),
        detail: detail,
        onNext: function () { startLevel(level + 1); },
        onRetry: function () { startLevel(level); },
        onLevels: showSelect
      });
    }, 850);
  }

  function shakeCurrent() {
    var rows = boardEl.querySelectorAll(".wg-row");
    var el = rows[state.guesses.length];
    if (!el) return;
    el.querySelectorAll(".wg-cell").forEach(function (c) {
      c.classList.add("shake"); setTimeout(function () { c.classList.remove("shake"); }, 400);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (playEl.hidden) return;
    var ov = document.getElementById("pz-result");
    if (ov && !ov.hidden) return;
    if (e.key === "Enter") handleKey("enter");
    else if (e.key === "Backspace") handleKey("back");
    else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toLowerCase());
  });

  window.addEventListener("hashchange", function () {
    var lv = parseInt(location.hash.slice(1), 10);
    if (lv >= 1 && lv <= MAX && lv !== level && PZ.canOpen(GAME, lv)) startLevel(lv);
    else if (!lv && !playEl.hidden) showSelect();
  });

  /* ---------- boot ---------- */
  (function boot() {
    var lv = parseInt(location.hash.slice(1), 10);
    if (lv >= 1 && lv <= MAX && PZ.canOpen(GAME, lv)) startLevel(lv);
    else showSelect();
  })();
})();
