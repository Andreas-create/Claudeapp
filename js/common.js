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

  // { reached: <furthest level attempted>, stars: {level: bestStars},
  //   lost: {level: true} }. A level counts as attempted whether won or lost;
  //   a lost level is finished and cannot be replayed.
  PZ.getProgress = function (game) {
    var p = read(PZ.progKey(game), null);
    if (!p) return { reached: 0, stars: {}, lost: {} };
    if (p.reached === undefined) p.reached = p.cleared || 0; // migrate old saves
    if (!p.stars) p.stars = {};
    if (!p.lost) p.lost = {};
    return p;
  };
  PZ.isUnlocked = function (game, level) { return level <= PZ.getProgress(game).reached + 1; };
  PZ.isWon = function (game, level) { return (PZ.getProgress(game).stars[level] || 0) > 0; };
  PZ.isLost = function (game, level) { return !!PZ.getProgress(game).lost[level]; };
  PZ.levelStars = function (game, level) { return PZ.getProgress(game).stars[level] || 0; };
  PZ.wonCount = function (game) { return Object.keys(PZ.getProgress(game).stars).length; };

  // Can this level be opened at all? Any non-locked level can be opened —
  // a win to replay, a loss to review (read-only), an unlocked level to play.
  PZ.canOpen = function (game, level, allOpen) {
    return allOpen || PZ.isWon(game, level) || PZ.isLost(game, level) || PZ.isUnlocked(game, level);
  };

  // Record a finished level. A win stores its best star rating; a loss marks
  // the level failed. Either way the reached frontier advances so the next
  // level unlocks (you are never stuck).
  PZ.markResult = function (game, level, won, stars) {
    var p = PZ.getProgress(game);
    if (won) { p.stars[level] = Math.max(p.stars[level] || 0, stars || 1); delete p.lost[level]; }
    else if (!(p.stars[level] > 0)) { p.lost[level] = true; }
    if (level > p.reached) p.reached = level;
    write(PZ.progKey(game), p);
    return p;
  };
  // Back-compat alias for win-only callers.
  PZ.markCleared = function (game, level, stars) { return PZ.markResult(game, level, true, stars); };

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
    links += '<a class="' + (activeId === "peru" ? "active" : "") + '" href="peru.html">🇵🇪 Peru</a>';
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

  // Celebratory phrases on a win, sassy-but-kind ones on a loss.
  var PRAISE = [
    "Slay! 💅", "Yes QUEEN 👑", "Snapped! 📸", "Werk! 💃", "You ate that 🍽️",
    "Iconic ✨", "Gagged! 😲", "Serving genius 💁", "Purse first 👛",
    "The house down boots 🏠", "Category is: WINNER 🏆", "Sickening! 💚",
    "Henny, you did THAT 🙌", "Legendary ✨", "Fierce 🔥", "Mother has arrived 👑",
    "Okurrr 💅", "Ate, no crumbs left 🍽️", "Pop off! 🎉", "Flawless, darling 💎"
  ];
  var SASHAY = [
    "Sashay away 💅", "Not your day, but still a star ⭐", "The library is open… read up 📚",
    "Chin up, sequins on ✨", "Better luck, gorgeous 💖", "That's a wrap, diva 🎬",
    "Reshuffle the wig, carry on 💇", "Even icons have off days 🌙",
    "Chic defeat — onward, superstar 🌟", "Bald cap! the next one's yours 🧢"
  ];
  function randomOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  PZ.praise = function () { return randomOf(PRAISE); };
  PZ.sashay = function () { return randomOf(SASHAY); };

  // Render the level grid for a game. `onPlay(level)` fires on tap.
  // `count` defaults to the 100-level ladder; packs pass their own size.
  PZ.renderLevelGrid = function (container, game, onPlay, count, allOpen) {
    count = count || PZ.LEVELS;
    var p = PZ.getProgress(game);
    var html = "";
    for (var l = 1; l <= count; l++) {
      var won = (p.stars[l] || 0) > 0;
      var lost = !!p.lost[l];
      var unlocked = allOpen || l <= p.reached + 1;
      var clickable = unlocked; // won=replay, lost=review, open=play
      var next = !allOpen && unlocked && !won && !lost && l === p.reached + 1;
      var cls = "lv " + (won ? "done" : lost ? "lost" : unlocked ? "open" : "locked") + (next ? " next" : "");
      var inner;
      if (won) inner = '<span class="lvnum">' + l + '</span><span class="lvstars">' + stars(p.stars[l]) + "</span>";
      else if (lost) inner = '<span class="lvnum">' + l + '</span><span class="lvx">✕</span>';
      else if (unlocked) inner = '<span class="lvnum">' + l + "</span>";
      else inner = '<span class="lvlock">🔒</span>';
      html += '<button class="' + cls + '" data-level="' + l + '"' + (clickable ? "" : " disabled") + ">" + inner + "</button>";
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
    var g = opts.game, lv = opts.level, max = opts.max || PZ.LEVELS, ao = opts.allOpen;
    // Nearest playable level in a direction (skips locked and lost levels).
    function step(dir) {
      for (var l = lv + dir; l >= 1 && l <= max; l += dir) if (PZ.canOpen(g, l, ao)) return l;
      return null;
    }
    var prevT = step(-1), nextT = step(1);
    container.className = "play-head";
    container.innerHTML =
      '<button class="btn back" data-act="levels">▦ Levels</button>' +
      '<div class="lvnav">' +
        '<button class="btn navbtn" data-act="prev"' + (prevT ? "" : " disabled") + ' aria-label="Previous level">◀</button>' +
        '<span class="level-label">' + opts.label + "</span>" +
        '<button class="btn navbtn" data-act="next"' + (nextT ? "" : " disabled") + ' aria-label="Next level">▶</button>' +
      "</div>";
    container.querySelector('[data-act="levels"]').addEventListener("click", opts.onLevels);
    if (prevT) container.querySelector('[data-act="prev"]').addEventListener("click", function () { opts.onGoto(prevT); });
    if (nextT) container.querySelector('[data-act="next"]').addEventListener("click", function () { opts.onGoto(nextT); });
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
    var last = opts.level >= (opts.max || PZ.LEVELS);
    var starRow = opts.won
      ? '<div class="result-stars">' + stars(opts.stars || 1) + "</div>"
      : "";
    // A loss cannot be replayed; both outcomes may advance to the next level.
    var nextBtn = !last ? '<button class="btn primary" id="pz-next">Next level →</button>' : "";
    var replayBtn = opts.won ? '<button class="btn" id="pz-retry">Replay</button>' : "";
    var lastMsg = (last && (opts.won || opts.reached))
      ? '<p class="result-line">🏆 ' + (opts.finalMsg || "You reached the end!") + "</p>"
      : "";
    ov.innerHTML =
      '<div class="sheet">' +
        '<h2>' + opts.title + "</h2>" +
        starRow +
        (opts.detail ? '<p class="result-line">' + opts.detail + "</p>" : "") +
        lastMsg +
        '<div class="btn-row">' +
          nextBtn + replayBtn +
          '<button class="btn" id="pz-levels">Levels</button>' +
        "</div>" +
      "</div>";
    ov.hidden = false;
    function close() { ov.hidden = true; }
    var nb = document.getElementById("pz-next");
    if (nb) nb.addEventListener("click", function () { close(); opts.onNext(); });
    var rb = document.getElementById("pz-retry");
    if (rb) rb.addEventListener("click", function () { close(); opts.onRetry(); });
    document.getElementById("pz-levels").addEventListener("click", function () { close(); opts.onLevels(); });
  };
  PZ.hideResult = function () {
    var ov = document.getElementById("pz-result");
    if (ov) ov.hidden = true;
  };

  window.PZ = PZ;
})();
