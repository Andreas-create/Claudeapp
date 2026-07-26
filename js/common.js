/* Shared utilities for the Puzzle Levels app.
   Exposed as a global `PZ` object so pages can be opened directly
   over file:// without ES-module CORS issues. */
(function () {
  "use strict";

  var PZ = {};
  PZ.LEVELS = 100;

  /* ---------- Seeded RNG (deterministic per level) ---------- */

  function xmur3(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return h >>> 0;
    };
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  PZ.rng = function (seedStr) {
    var seed = xmur3(String(seedStr));
    return mulberry32(seed());
  };
  PZ.randInt = function (rng, min, max) { return min + Math.floor(rng() * (max - min + 1)); };
  PZ.pick = function (rng, arr) { return arr[Math.floor(rng() * arr.length)]; };
  PZ.shuffle = function (rng, arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  /* ---------- Storage: level progress ---------- */

  function read(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  PZ.progKey = function (game) { return "pz:" + game + ":progress"; };

  // { cleared: <highest sequentially-cleared level>, stars: { level: bestStars } }
  PZ.getProgress = function (game) {
    return read(PZ.progKey(game), { cleared: 0, stars: {} });
  };
  PZ.isUnlocked = function (game, level) { return level <= PZ.getProgress(game).cleared + 1; };
  PZ.isCleared = function (game, level) { return level <= PZ.getProgress(game).cleared; };
  PZ.levelStars = function (game, level) { return PZ.getProgress(game).stars[level] || 0; };

  // Record a win. Advances the cleared frontier when the next level is beaten,
  // and keeps the best star rating for replays.
  PZ.markCleared = function (game, level, stars) {
    var p = PZ.getProgress(game);
    p.stars[level] = Math.max(p.stars[level] || 0, stars || 1);
    if (level === p.cleared + 1) p.cleared = level;
    write(PZ.progKey(game), p);
    return p;
  };
  PZ.totalStars = function (game) {
    var s = PZ.getProgress(game).stars, sum = 0;
    for (var k in s) if (s.hasOwnProperty(k)) sum += s[k];
    return sum;
  };

  /* ---------- UI helpers ---------- */

  var GAMES = [
    { id: "wordle", name: "Word Guess", path: "wordle.html", icon: "🔤" },
    { id: "connections", name: "Connections", path: "connections.html", icon: "🔗" },
    { id: "digits", name: "Digits", path: "digits.html", icon: "🔢" }
  ];
  PZ.GAMES = GAMES;

  PZ.renderNav = function (activeId) {
    var el = document.getElementById("nav");
    if (!el) return;
    var links = GAMES.map(function (g) {
      return '<a class="' + (g.id === activeId ? "active" : "") + '" href="' + g.path + '">' + g.name + "</a>";
    }).join("");
    el.className = "nav";
    el.innerHTML =
      '<a class="brand" href="index.html">🧩 <span>Levels</span></a>' +
      '<div class="spacer"></div><div class="links">' + links + "</div>";
  };

  var toastTimer = null;
  PZ.toast = function (text, ms) {
    var t = document.createElement("div");
    t.className = "toast"; t.textContent = text;
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.remove(); }, ms || 1400);
  };

  // Render the 1..100 level grid for a game. `onPlay(level)` fires on tap.
  PZ.renderLevelGrid = function (container, game, onPlay) {
    var p = PZ.getProgress(game);
    var html = "";
    for (var l = 1; l <= PZ.LEVELS; l++) {
      var cleared = l <= p.cleared;
      var unlocked = l <= p.cleared + 1;
      var next = unlocked && !cleared;
      var cls = "lv " + (cleared ? "done" : unlocked ? "open" : "locked") + (next ? " next" : "");
      var inner = unlocked
        ? '<span class="lvnum">' + l + "</span>" +
          (cleared ? '<span class="lvstars">' + stars(p.stars[l] || 1) + "</span>" : "")
        : '<span class="lvlock">🔒</span>';
      html += '<button class="' + cls + '" data-level="' + l + '"' + (unlocked ? "" : " disabled") + ">" + inner + "</button>";
    }
    container.innerHTML = html;
    container.querySelectorAll("button:not([disabled])").forEach(function (b) {
      b.addEventListener("click", function () { onPlay(parseInt(b.getAttribute("data-level"), 10)); });
    });
  };

  function stars(n) {
    var s = "";
    for (var i = 1; i <= 3; i++) s += i <= n ? "★" : "☆";
    return s;
  }
  PZ.starString = stars;

  // Play-view header with a Levels button and prev/next level arrows.
  // opts: {game, level, label, onGoto(level), onLevels}
  PZ.renderPlayNav = function (container, opts) {
    var g = opts.game, lv = opts.level;
    var prevOff = lv <= 1;
    var nextOff = lv >= PZ.LEVELS || !PZ.isUnlocked(g, lv + 1);
    container.className = "play-head";
    container.innerHTML =
      '<button class="btn back" data-act="levels">▦ Levels</button>' +
      '<div class="lvnav">' +
        '<button class="btn navbtn" data-act="prev"' + (prevOff ? " disabled" : "") + ' aria-label="Previous level">◀</button>' +
        '<span class="level-label">' + opts.label + "</span>" +
        '<button class="btn navbtn" data-act="next"' + (nextOff ? " disabled" : "") + ' aria-label="Next level">▶</button>' +
      "</div>";
    container.querySelector('[data-act="levels"]').addEventListener("click", opts.onLevels);
    if (!prevOff) container.querySelector('[data-act="prev"]').addEventListener("click", function () { opts.onGoto(lv - 1); });
    if (!nextOff) container.querySelector('[data-act="next"]').addEventListener("click", function () { opts.onGoto(lv + 1); });
  };

  // Full-screen level-complete overlay. opts: {game, level, won, title, detail,
  // stars, onNext, onRetry, onLevels}
  PZ.showResult = function (opts) {
    var ov = document.getElementById("pz-result");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "pz-result";
      ov.className = "overlay";
      document.body.appendChild(ov);
    }
    var last = opts.level >= PZ.LEVELS;
    var starRow = opts.won
      ? '<div class="result-stars">' + stars(opts.stars || 1) + "</div>"
      : "";
    var nextBtn = (opts.won && !last)
      ? '<button class="btn primary" id="pz-next">Next level →</button>' : "";
    var lastMsg = (opts.won && last) ? '<p class="result-line">🏆 You finished all 100 levels!</p>' : "";
    ov.innerHTML =
      '<div class="sheet">' +
        '<h2>' + opts.title + "</h2>" +
        starRow +
        (opts.detail ? '<p class="result-line">' + opts.detail + "</p>" : "") +
        lastMsg +
        '<div class="btn-row">' +
          nextBtn +
          '<button class="btn" id="pz-retry">' + (opts.won ? "Replay" : "Try again") + "</button>" +
          '<button class="btn" id="pz-levels">Levels</button>' +
        "</div>" +
      "</div>";
    ov.hidden = false;
    function close() { ov.hidden = true; }
    var nb = document.getElementById("pz-next");
    if (nb) nb.addEventListener("click", function () { close(); opts.onNext(); });
    document.getElementById("pz-retry").addEventListener("click", function () { close(); opts.onRetry(); });
    document.getElementById("pz-levels").addEventListener("click", function () { close(); opts.onLevels(); });
  };
  PZ.hideResult = function () {
    var ov = document.getElementById("pz-result");
    if (ov) ov.hidden = true;
  };

  window.PZ = PZ;
})();
