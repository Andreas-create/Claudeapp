/* Digits — 100 levels. Combine the numbers with + - x / to reach the target.
   Difficulty ramps by how many numbers you juggle (3 -> 6) and how large the
   target and numbers get. Every level is generated solvable by construction. */
(function () {
  "use strict";
  PZ.renderNav("digits");

  var GAME = "digits";
  var OPS = [
    { id: "+", label: "+" }, { id: "-", label: "−" },
    { id: "*", label: "×" }, { id: "/", label: "÷" }
  ];

  var selectEl = document.getElementById("select");
  var playEl = document.getElementById("play");
  var tilesEl = document.getElementById("tiles");
  var opsEl = document.getElementById("ops");

  function apply(op, a, b) {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b !== 0 && a % b === 0 ? a / b : null;
    }
    return null;
  }

  function levelConfig(level) {
    var tiles = level <= 20 ? 3 : level <= 45 ? 4 : level <= 70 ? 5 : 6;
    var nBig = tiles <= 3 ? 0 : tiles === 4 ? 1 : 2;
    var bigs = level <= 20 ? [10] : level <= 45 ? [10, 15, 20] : [10, 15, 20, 25];
    return {
      tiles: tiles, nBig: nBig, bigs: bigs,
      lo: 10 + level,
      hi: Math.min(999, 40 + level * 8)
    };
  }

  // Deterministic, guaranteed-solvable puzzle for a level.
  function generate(level) {
    var cfg = levelConfig(level);
    for (var attempt = 0; attempt < 400; attempt++) {
      var rng = PZ.rng("digits:" + level + ":" + attempt);
      var smalls = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      var nums = [];
      for (var i = 0; i < cfg.tiles - cfg.nBig; i++) nums.push(PZ.pick(rng, smalls));
      for (var j = 0; j < cfg.nBig; j++) nums.push(PZ.pick(rng, cfg.bigs));

      var work = nums.slice(), ok = true;
      while (work.length > 1) {
        var ai = Math.floor(rng() * work.length);
        var bi = Math.floor(rng() * work.length);
        if (ai === bi) bi = (bi + 1) % work.length;
        var a = work[ai], b = work[bi];
        var order = PZ.shuffle(rng, OPS.map(function (o) { return o.id; }));
        var res = null;
        for (var k = 0; k < order.length; k++) {
          var v = apply(order[k], a, b);
          if (v !== null && v > 0 && v <= 999) { res = v; break; }
        }
        if (res === null) { ok = false; break; }
        var next = [];
        for (var m = 0; m < work.length; m++) if (m !== ai && m !== bi) next.push(work[m]);
        next.push(res);
        work = next;
      }
      if (!ok) continue;
      var target = work[0];
      if (target >= cfg.lo && target <= cfg.hi && nums.indexOf(target) === -1) {
        return { nums: nums, target: target, tiles: cfg.tiles };
      }
    }
    return { nums: [2, 3, 4, 5, 10, 20].slice(0, levelConfig(level).tiles), target: 20 + level, tiles: levelConfig(level).tiles };
  }

  // ----- active level state -----
  var level = 0, puzzle = null, stack = [], moves = [], penalty = 0;
  var finished = false, won = false, nextId = 100;
  var selTile = null, selOp = null;

  function current() { return stack[stack.length - 1]; }
  function freshTiles() { return puzzle.nums.map(function (v, i) { return { id: i, val: v }; }); }

  function startLevel(lv) {
    level = lv;
    puzzle = generate(lv);
    stack = [freshTiles()];
    moves = []; penalty = 0; finished = false; won = false;
    nextId = 100; selTile = null; selOp = null;
    PZ.hideResult();

    selectEl.hidden = true;
    playEl.hidden = false;
    document.getElementById("level-label").textContent = "Level " + lv + " · " + puzzle.tiles + " numbers";
    document.getElementById("target").textContent = puzzle.target;
    document.getElementById("msg").textContent = "";
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
    if (selTile === id) { selTile = null; render(); return; }
    if (selOp === null) { selTile = id; render(); return; }

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
    var newTiles = tiles.filter(function (t) { return t.id !== selTile && t.id !== id; })
      .concat([{ id: nextId++, val: res }]);
    stack.push(newTiles);
    selTile = null; selOp = null;

    if (res === puzzle.target) return finish();
    if (newTiles.length === 1) PZ.toast("No moves left — undo to retry");
    render();
  }

  function tapOp(id) {
    if (finished || selTile === null) { if (selTile === null) PZ.toast("Pick a number first"); return; }
    selOp = (selOp === id) ? null : id;
    render();
  }

  function finish() {
    finished = true; won = true;
    render();
    var stars = penalty === 0 ? 3 : penalty <= 3 ? 2 : 1;
    PZ.markCleared(GAME, level, stars);
    PZ.toast("Solved!");
    setTimeout(function () {
      PZ.showResult({
        game: GAME, level: level, won: true, stars: stars,
        title: "Level " + level + " complete!",
        detail: "Reached " + puzzle.target + " in " + moves.length + " steps",
        onNext: function () { startLevel(level + 1); },
        onRetry: function () { startLevel(level); },
        onLevels: showSelect
      });
    }, 700);
  }

  document.getElementById("undo-btn").addEventListener("click", function () {
    if (stack.length <= 1 || finished) return;
    stack.pop(); moves.pop(); penalty += 1;
    selTile = null; selOp = null;
    render();
  });
  document.getElementById("reset-btn").addEventListener("click", function () {
    if (finished) return;
    if (stack.length > 1) penalty += 1;
    stack = [freshTiles()]; moves = [];
    selTile = null; selOp = null;
    render();
  });
  document.getElementById("back").addEventListener("click", showSelect);
  window.addEventListener("hashchange", function () {
    var lv = parseInt(location.hash.slice(1), 10);
    if (!lv && !playEl.hidden) showSelect();
  });

  /* ---------- boot ---------- */
  (function boot() {
    var lv = parseInt(location.hash.slice(1), 10);
    if (lv >= 1 && lv <= PZ.LEVELS && PZ.isUnlocked(GAME, lv)) startLevel(lv);
    else showSelect();
  })();
})();
