/* Shared utilities for the Daily Puzzles app.
   Exposed as a global `PZ` object so pages can be opened directly
   over file:// without ES-module CORS issues. */
(function () {
  "use strict";

  // Day 0 of the puzzle universe. Puzzle numbers count up from here.
  var EPOCH = Date.UTC(2024, 0, 1); // 2024-01-01

  var PZ = {};

  /* ---------- Dates ---------- */

  // Local calendar date as YYYY-MM-DD.
  PZ.dateKey = function (d) {
    d = d || new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  };

  // Whole days between the epoch and the given local date (>= 0 for today).
  PZ.dayNumber = function (d) {
    d = d || new Date();
    var midnight = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.floor((midnight - EPOCH) / 86400000);
  };

  PZ.prettyDate = function (d) {
    d = d || new Date();
    return d.toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric", year: "numeric"
    });
  };

  // Milliseconds until next local midnight.
  PZ.msUntilTomorrow = function () {
    var now = new Date();
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return next.getTime() - now.getTime();
  };

  /* ---------- Seeded RNG (deterministic per day) ---------- */

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

  // Deterministic generator seeded from a string.
  PZ.rng = function (seedStr) {
    var seed = xmur3(String(seedStr));
    return mulberry32(seed());
  };

  PZ.randInt = function (rng, min, max) {
    return min + Math.floor(rng() * (max - min + 1));
  };

  PZ.pick = function (rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  };

  // Fisher-Yates using a seeded rng; returns a new array.
  PZ.shuffle = function (rng, arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  /* ---------- Storage: stats & daily state ---------- */

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  PZ.statsKey = function (game) { return "pz:" + game + ":stats"; };
  PZ.stateKey = function (game) { return "pz:" + game + ":state"; };

  PZ.getStats = function (game) {
    return read(PZ.statsKey(game), {
      played: 0, won: 0, currentStreak: 0, maxStreak: 0,
      lastWonDay: null, dist: {}
    });
  };

  // Record a finished game. `bucket` is optional (e.g. guess count for wordle).
  PZ.recordResult = function (game, won, bucket) {
    var s = PZ.getStats(game);
    var today = PZ.dayNumber();
    s.played += 1;
    if (won) {
      s.won += 1;
      // Streak continues if last win was yesterday, resets otherwise.
      if (s.lastWonDay === today - 1) s.currentStreak += 1;
      else if (s.lastWonDay === today) { /* already counted today */ }
      else s.currentStreak = 1;
      s.lastWonDay = today;
      if (s.currentStreak > s.maxStreak) s.maxStreak = s.currentStreak;
      if (bucket != null) s.dist[bucket] = (s.dist[bucket] || 0) + 1;
    } else {
      s.currentStreak = 0;
    }
    write(PZ.statsKey(game), s);
    return s;
  };

  // Per-day saved state so a refresh resumes the same puzzle.
  PZ.loadDaily = function (game) {
    var st = read(PZ.stateKey(game), null);
    if (st && st.day === PZ.dayNumber()) return st.data;
    return null;
  };
  PZ.saveDaily = function (game, data) {
    write(PZ.stateKey(game), { day: PZ.dayNumber(), data: data });
  };

  /* ---------- UI helpers ---------- */

  var GAMES = [
    { id: "wordle", name: "Word Guess", path: "wordle.html" },
    { id: "connections", name: "Connections", path: "connections.html" },
    { id: "digits", name: "Digits", path: "digits.html" }
  ];
  PZ.GAMES = GAMES;

  PZ.renderNav = function (activeId) {
    var el = document.getElementById("nav");
    if (!el) return;
    var links = GAMES.map(function (g) {
      var cls = g.id === activeId ? "active" : "";
      return '<a class="' + cls + '" href="' + g.path + '">' + g.name + "</a>";
    }).join("");
    el.className = "nav";
    el.innerHTML =
      '<a class="brand" href="index.html">🧩 <span>Daily</span></a>' +
      '<div class="spacer"></div>' +
      '<div class="links">' + links + "</div>";
  };

  var toastTimer = null;
  PZ.toast = function (text, ms) {
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.remove(); }, ms || 1400);
  };

  PZ.fmtCountdown = function (ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    function p(n) { return String(n).padStart(2, "0"); }
    return p(h) + ":" + p(m) + ":" + p(sec);
  };

  // Runs a live countdown to midnight inside `el`, calling onZero once.
  PZ.startCountdown = function (el, onZero) {
    if (!el) return;
    function tick() {
      var ms = PZ.msUntilTomorrow();
      el.innerHTML = "Next puzzles in <b>" + PZ.fmtCountdown(ms) + "</b>";
      if (ms <= 0 && onZero) onZero();
    }
    tick();
    return setInterval(tick, 1000);
  };

  window.PZ = PZ;
})();
