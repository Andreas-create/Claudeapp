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
  PZ.wonCount = function (game) { return Object.keys(PZ.getProgress(game).stars).length; };

  // Can this level be opened at all? Any non-locked level can be opened —
  // a win to replay, a loss to review (read-only), an unlocked level to play.
  // openable() is the same test against an already-loaded progress object,
  // for callers that check many levels at once.
  function openable(p, level, allOpen) {
    return !!(allOpen || (p.stars[level] || 0) > 0 || p.lost[level] || level <= p.reached + 1);
  }
  PZ.canOpen = function (game, level, allOpen) {
    return openable(PZ.getProgress(game), level, allOpen);
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

  // Wire up the shared hint UI (#hint-btn/#hint-count/#hint-panel).
  // 2 hints per puzzle: select one word, tap Hint, get its encyclopedia
  // explanation. A failed lookup does not consume a hint.
  // Returns {reset} to re-arm when a new level starts.
  PZ.setupHints = function (opts) {
    var btn = document.getElementById("hint-btn");
    var countEl = document.getElementById("hint-count");
    var panel = document.getElementById("hint-panel");
    var wordEl = document.getElementById("hint-word");
    var textEl = document.getElementById("hint-text");
    if (!btn) return { reset: function () {} };
    var MAX = 2, left = MAX, busy = false;

    function sync() {
      countEl.textContent = left;
      btn.disabled = left <= 0 || busy;
    }
    btn.addEventListener("click", function () {
      if (left <= 0 || busy) return;
      var word = opts.getSelectedWord();
      if (!word) { PZ.toast("Select one word first"); return; }
      busy = true; sync();
      btn.classList.add("thinking");
      PZ.defineWord(word, function (text) {
        busy = false;
        btn.classList.remove("thinking");
        if (text) {
          left -= 1;
          panel.hidden = false;
          wordEl.textContent = "💡 " + word;
          textEl.textContent = text;
        } else {
          PZ.toast("No entry found — hint not used");
        }
        sync();
      });
    });
    sync();
    return {
      reset: function () {
        left = MAX; busy = false;
        panel.hidden = true;
        sync();
      }
    };
  };

  /* ---------- UI helpers ---------- */

  var GAMES = [
    { id: "wordle", name: "Word Guess", path: "wordle.html", icon: "🔤", levels: 200 },
    { id: "connections", name: "Affinity", path: "connections.html", icon: "🔗", levels: 200 },
    { id: "digits", name: "Digits", path: "digits.html", icon: "🔢", levels: 200 }
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
      '<a class="brand" href="index.html">🧩 <span>Brainbow</span></a>' +
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

  /* ---------- Word explanations (hints) ---------- */

  // Look up a short encyclopedia-style explanation for a word.
  // Curated definitions win (reliable, offline); otherwise the English
  // Wikipedia REST summary is fetched. Calls cb(text|null).
  PZ.defineWord = function (word, cb) {
    var curated = (window.BRAINBOW_DEFS || {})[word.toUpperCase()];
    if (curated) { cb(curated); return; }
    var url = "https://en.wikipedia.org/api/rest_v1/page/summary/" +
      encodeURIComponent(word.toLowerCase()) + "?redirect=true";
    fetch(url)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (j && j.extract && j.type !== "disambiguation") {
          // keep it hint-sized: first sentence or two
          var text = j.extract;
          if (text.length > 220) {
            var cut = text.indexOf(". ", 120);
            if (cut !== -1) text = text.slice(0, cut + 1);
            else text = text.slice(0, 217) + "…";
          }
          cb(text);
        } else {
          cb(null);
        }
      })
      .catch(function () { cb(null); });
  };

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

  // Play-view header with a Levels button and prev/next level arrows.
  // opts: {game, level, label, onGoto(level), onLevels}
  PZ.renderPlayNav = function (container, opts) {
    var lv = opts.level, max = opts.max || PZ.LEVELS, ao = opts.allOpen;
    var prog = PZ.getProgress(opts.game); // one read for the whole scan
    // Nearest openable level in a direction (skips locked levels).
    function step(dir) {
      for (var l = lv + dir; l >= 1 && l <= max; l += dir) if (openable(prog, l, ao)) return l;
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
