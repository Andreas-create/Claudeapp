/* Digits — combine six numbers with +, −, ×, ÷ to reach the target.
   The puzzle is generated deterministically per day and is always
   solvable (the target is built by combining the six starting numbers). */
(function () {
  "use strict";
  PZ.renderNav("digits");

  var GAME = "digits";
  var OPS = [
    { id: "+", label: "+" },
    { id: "-", label: "−" },
    { id: "*", label: "×" },
    { id: "/", label: "÷" }
  ];
  var puzzleNo = PZ.dayNumber();
  document.getElementById("subhead").textContent = "Puzzle #" + puzzleNo + " · use each number once";

  /* ---------- deterministic generation ---------- */
  function apply(op, a, b) {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b !== 0 && a % b === 0 ? a / b : null;
    }
    return null;
  }

  // Build a solvable puzzle: choose 6 numbers, then fold them down with
  // random valid ops to derive an interesting target.
  function generate() {
    for (var attempt = 0; attempt < 200; attempt++) {
      var rng = PZ.rng("digits:" + puzzleNo + ":" + attempt);
      var smalls = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      var bigs = [10, 15, 20, 25];
      var nums = [];
      for (var i = 0; i < 4; i++) nums.push(PZ.pick(rng, smalls));
      for (var j = 0; j < 2; j++) nums.push(PZ.pick(rng, bigs));

      // Fold down to a single target using random valid operations.
      var work = nums.slice();
      var ok = true;
      while (work.length > 1) {
        var ai = Math.floor(rng() * work.length);
        var bi = Math.floor(rng() * work.length);
        if (ai === bi) { bi = (bi + 1) % work.length; }
        var a = work[ai], b = work[bi];
        // Try operations in a shuffled order, keep first positive integer.
        var order = PZ.shuffle(rng, OPS.map(function (o) { return o.id; }));
        var res = null;
        for (var k = 0; k < order.length; k++) {
          var v = apply(order[k], a, b);
          if (v !== null && v > 0 && v <= 999) { res = v; break; }
        }
        if (res === null) { ok = false; break; }
        // remove a and b, add res
        var next = [];
        for (var m = 0; m < work.length; m++) {
          if (m !== ai && m !== bi) next.push(work[m]);
        }
        next.push(res);
        work = next;
      }
      if (!ok) continue;
      var target = work[0];
      // Keep it interesting: sizeable target not already sitting on a tile.
      if (target >= 30 && target <= 600 && nums.indexOf(target) === -1) {
        return { nums: nums, target: target };
      }
    }
    // Fallback (should never hit): trivial guaranteed puzzle.
    return { nums: [2, 3, 4, 5, 10, 20], target: 100 };
  }

  var puzzle = generate();
  document.getElementById("target").textContent = puzzle.target;

  /* ---------- state ---------- */
  // A "tile" is { id, val }. `stack` holds successive tile-lists for undo.
  var saved = PZ.loadDaily(GAME);
  var stack, moves, finished, won;
  if (saved) {
    stack = saved.stack;
    moves = saved.moves;
    finished = saved.finished;
    won = saved.won;
  } else {
    stack = [puzzle.nums.map(function (v, i) { return { id: i, val: v }; })];
    moves = [];       // record of operations for share text
    finished = false;
    won = false;
  }
  var nextId = 100;

  var selTile = null;   // selected tile id (first operand)
  var selOp = null;     // selected operator id

  var tilesEl = document.getElementById("tiles");
  var opsEl = document.getElementById("ops");

  function current() { return stack[stack.length - 1]; }

  function persist() {
    PZ.saveDaily(GAME, { stack: stack, moves: moves, finished: finished, won: won });
  }

  /* ---------- rendering ---------- */
  function render() {
    var tiles = current();
    tilesEl.innerHTML = "";
    tiles.forEach(function (t) {
      var b = document.createElement("button");
      b.className = "dg-tile" + (selTile === t.id ? " sel" : "");
      b.textContent = t.val;
      b.disabled = finished;
      b.addEventListener("click", function () { tapTile(t.id); });
      tilesEl.appendChild(b);
    });

    opsEl.innerHTML = "";
    OPS.forEach(function (o) {
      var b = document.createElement("button");
      b.className = "dg-op" + (selOp === o.id ? " sel" : "");
      b.textContent = o.label;
      b.disabled = finished;
      b.addEventListener("click", function () { tapOp(o.id); });
      opsEl.appendChild(b);
    });

    document.getElementById("undo-btn").disabled = finished || stack.length <= 1;
  }

  /* ---------- interaction ---------- */
  function tapTile(id) {
    if (finished) return;
    if (selTile === null) { selTile = id; render(); return; }
    if (selTile === id) { selTile = null; render(); return; } // deselect
    if (selOp === null) { selTile = id; render(); return; }   // switch first operand

    // We have a, op, b -> compute
    var tiles = current();
    var a = tiles.find(function (t) { return t.id === selTile; });
    var b = tiles.find(function (t) { return t.id === id; });
    var res = apply(selOp, a.val, b.val);

    if (res === null || res <= 0) {
      PZ.toast(res === null && selOp === "/" ? "Must divide evenly" : "No negatives");
      return;
    }

    var symbol = OPS.find(function (o) { return o.id === selOp; }).label;
    moves.push(a.val + " " + symbol + " " + b.val + " = " + res);

    var newTiles = tiles
      .filter(function (t) { return t.id !== selTile && t.id !== id; })
      .concat([{ id: nextId++, val: res }]);
    stack.push(newTiles);
    selTile = null;
    selOp = null;

    if (res === puzzle.target) {
      finished = true; won = true;
      persist();
      PZ.recordResult(GAME, true, moves.length);
      render();
      PZ.toast("Solved!");
      setTimeout(showStats, 700);
      return;
    }
    if (newTiles.length === 1) {
      // Only one tile left and it isn't the target — dead end this line.
      PZ.toast("No moves left — undo to retry");
    }
    persist();
    render();
  }

  function tapOp(id) {
    if (finished || selTile === null) { if (selTile === null) PZ.toast("Pick a number first"); return; }
    selOp = (selOp === id) ? null : id;
    render();
  }

  document.getElementById("undo-btn").addEventListener("click", function () {
    if (stack.length <= 1) return;
    stack.pop();
    moves.pop();
    selTile = null; selOp = null;
    persist();
    render();
  });
  document.getElementById("reset-btn").addEventListener("click", function () {
    if (finished) return;
    stack = [puzzle.nums.map(function (v, i) { return { id: i, val: v }; })];
    moves = [];
    selTile = null; selOp = null;
    persist();
    render();
  });

  /* ---------- stats ---------- */
  var countdownTimer = null;
  function showStats() {
    var s = PZ.getStats(GAME);
    var winPct = s.played ? Math.round((s.won / s.played) * 100) : 0;
    document.getElementById("result-line").textContent =
      won ? "Reached " + puzzle.target + " in " + moves.length + " steps" : "";
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
  function shareText() {
    var head = "Digits #" + puzzleNo + " — target " + puzzle.target + (won ? " ✅" : "");
    return [head, ""].concat(moves).join("\n");
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
  render();
  if (finished) setTimeout(showStats, 300);
})();
