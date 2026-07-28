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
  // Every level is playable from the start — nothing is gated behind clearing
  // the one before it. Kept as a function because callers still ask.
  PZ.isUnlocked = function () { return true; };
  PZ.isWon = function (game, level) { return (PZ.getProgress(game).stars[level] || 0) > 0; };
  PZ.isLost = function (game, level) { return !!PZ.getProgress(game).lost[level]; };
  PZ.wonCount = function (game) { return Object.keys(PZ.getProgress(game).stars).length; };

  /* Can this level be opened? Always — players pick any level in any order.
     Brainbow used to gate level N+1 behind clearing N; that is gone, and the
     `allOpen` flag the packs used to pass is now the behaviour everywhere.

     This is NOT the same question as "can it be played". A lost level still
     opens read-only for review; the engines check PZ.isLost for that, and this
     change does not touch it. */
  function openable() { return true; }
  PZ.canOpen = function () { return true; };

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
      var sel = opts.getSelected();
      if (!sel) { PZ.toast("Select one word first"); return; }
      busy = true; sync();
      btn.classList.add("thinking");
      PZ.defineWord(sel.word, sel.cat, function (text) {
        busy = false;
        btn.classList.remove("thinking");
        if (text) {
          left -= 1;
          panel.hidden = false;
          wordEl.textContent = "💡 " + sel.word;
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
    { id: "digits", name: "Crunch", path: "digits.html", icon: "🔢", levels: 200 }
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

  /* ---------- "Add to your phone" (PWA install) ---------- */

  /* Chrome and Edge fire beforeinstallprompt instead of installing outright,
     so stash the event and let our own button trigger the real prompt. The
     listener is registered as the file loads, because the event can fire
     before anything else has had a chance to ask for it.
     Safari on iOS has no such API at all — there the button can only explain
     the Share → Add to Home Screen route, which is why this falls back to
     instructions rather than pretending every browser can be prompted. */
  var deferredInstall = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredInstall = e;
    var b = document.getElementById("pz-install-btn");
    if (b) b.textContent = "📲 Install Brainbow";
  });

  /* True when Brainbow is running as an installed app rather than in a browser
     tab, so the install button can stay hidden for people who already have it.
     The manifest asks for "standalone", but a launcher may hand back
     fullscreen or minimal-ui, and iOS reports it through navigator.standalone
     instead of a media query — so check all four.
     Note the limit: this detects "launched from the home screen", not "is
     installed somewhere". Someone who has installed Brainbow and then opens it
     in a normal browser tab will still see the button. There is no reliable
     cross-browser way to ask "is this already installed?" from a tab. */
  function alreadyInstalled() {
    try {
      var modes = ["standalone", "fullscreen", "minimal-ui"];
      for (var i = 0; i < modes.length; i++) {
        if (window.matchMedia && window.matchMedia("(display-mode: " + modes[i] + ")").matches) {
          return true;
        }
      }
      return window.navigator.standalone === true; // iOS Safari home-screen launch
    } catch (e) { return false; }
  }

  // Per-platform steps, because the gesture genuinely differs.
  function installSteps() {
    var ua = navigator.userAgent || "";
    var iOS = /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    var android = /Android/.test(ua);
    if (iOS) {
      return {
        head: "On iPhone or iPad",
        steps: [
          "Open Brainbow in <b>Safari</b> (this only works there).",
          "Tap the <b>Share</b> button — the square with an arrow out of it.",
          "Scroll down and tap <b>Add to Home Screen</b>.",
          "Tap <b>Add</b>. Brainbow now sits with your other apps."
        ]
      };
    }
    if (android) {
      return {
        head: "On Android",
        steps: [
          "Tap the <b>⋮</b> menu at the top right of the browser.",
          "Choose <b>Install app</b> or <b>Add to Home screen</b>.",
          "Confirm, and Brainbow joins your other apps."
        ]
      };
    }
    return {
      head: "On a computer",
      steps: [
        "Look for the <b>install icon</b> in the address bar — a small screen with a downward arrow.",
        "Or open the browser menu and choose <b>Install Brainbow</b>.",
        "It then opens in its own window, with no tabs or address bar."
      ]
    };
  }

  function showInstallHelp() {
    var info = installSteps();
    var ov = document.getElementById("pz-install");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "pz-install";
      ov.className = "overlay";
      document.body.appendChild(ov);
    }
    ov.innerHTML =
      '<div class="sheet">' +
        "<h2>Play Brainbow like an app 📲</h2>" +
        '<p class="result-line">' + info.head + "</p>" +
        '<ol class="install-steps">' +
          info.steps.map(function (s) { return "<li>" + s + "</li>"; }).join("") +
        "</ol>" +
        '<p class="install-note">Once it is added, Brainbow works with no signal at all — ' +
          "every puzzle keeps playing offline, and your progress stays on the device.</p>" +
        '<div class="btn-row"><button class="btn primary" id="pz-install-close">Got it</button></div>' +
      "</div>";
    ov.hidden = false;
    function close() { ov.hidden = true; }
    document.getElementById("pz-install-close").addEventListener("click", close);
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
  }

  // Mounts the install button into `mount`. Renders nothing when Brainbow is
  // already running as an installed app — there is nothing left to offer.
  PZ.setupInstall = function (mount) {
    if (!mount || alreadyInstalled()) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "pz-install-btn";
    btn.className = "btn install-btn";
    btn.textContent = deferredInstall ? "📲 Install Brainbow" : "📲 Add to your phone";
    mount.appendChild(btn);

    btn.addEventListener("click", function () {
      if (deferredInstall) {
        deferredInstall.prompt();
        var choice = deferredInstall.userChoice;
        deferredInstall = null;
        if (choice && choice.then) {
          choice.then(function (res) {
            // Declining is fine — leave the button so they can change their mind.
            if (res && res.outcome === "accepted") btn.remove();
          })["catch"](function () {});
        }
        return;
      }
      showInstallHelp();
    });

    window.addEventListener("appinstalled", function () {
      btn.remove();
      PZ.toast("Installed — Brainbow is on your home screen 📲", 2200);
    });
  };

  // Celebratory phrases on a win, sassy-but-kind ones on a loss.
  var PRAISE = [
    "Slay! 💅", "Yes QUEEN 👑", "Snapped! 📸", "Werk! 💃", "You ate that 🍽️",
    "Iconic ✨", "Gagged! 😲", "Serving genius 💁", "Purse first 👛",
    "The house down boots 🏠", "Sickening! 💚", "Legendary ✨", "Fierce 🔥",
    "Mother has arrived 👑", "Okurrr 💅", "Ate, no crumbs left 🍽️",
    "Pop off! 🎉", "Flawless, darling 💎", "Shantay, you stay ✨",
    "You understood the assignment 📝", "Lip synced for your life — and won 🎤",
    "Legendary children 👑", "The girls are STUNNED 😲", "Chef's kiss, diva 😘",
    "Runway ready 🌟", "Crown's still on 👑", "Beauty AND brains 💋"
  ];
  var SASHAY = [
    "Sashay away 💅", "Not your day, but still a star ⭐", "The library is open… read up 📚",
    "Better luck, gorgeous 💖", "That's a wrap, diva 🎬",
    "Reshuffle the wig, carry on 💇", "Even icons have off days 🌙",
    "Chic defeat — onward, superstar 🌟", "Exit stage left, still gorgeous 🎭",
    "Not your crown this time, still your kingdom 👑",
    "Dust yourself off, sparkle intact 💫", "The judges were harsh, darling ⚖️"
  ];
  function randomOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  PZ.praise = function () { return randomOf(PRAISE); };
  PZ.sashay = function () { return randomOf(SASHAY); };

  /* ---------- Word explanations (hints) ---------- */

  // Look up a short explanation for a word. Everything ships in
  // data/definitions.js, so hints work offline and never hit the network.
  // `cat` is the word's group category: a handful of words mean different
  // things in different groups (BOW the front of a ship vs. BOW the knot),
  // and BRAINBOW_DEFS_BY_CAT holds those per-category readings.
  // Kept callback-shaped so callers do not care that it now answers at once.
  PZ.defineWord = function (word, cat, cb) {
    var key = String(word).toUpperCase();
    var byCat = window.BRAINBOW_DEFS_BY_CAT || {};
    var text = (cat && byCat[cat + "||" + key]) || (window.BRAINBOW_DEFS || {})[key] || null;
    cb(text);
  };

  // Render the level grid for a game. `onPlay(level)` fires on tap.
  // `count` defaults to the 100-level ladder; packs pass their own size.
  // Every level is tappable — nothing is locked.
  PZ.renderLevelGrid = function (container, game, onPlay, count) {
    count = count || PZ.LEVELS;
    var p = PZ.getProgress(game);
    var html = "";
    for (var l = 1; l <= count; l++) {
      var won = (p.stars[l] || 0) > 0;
      var lost = !!p.lost[l];
      // Ring the level after the furthest one reached — not a gate, just a
      // "you got up to here" marker so picking up where you left off is easy.
      var next = !won && !lost && l === p.reached + 1;
      var cls = "lv " + (won ? "done" : lost ? "lost" : "open") + (next ? " next" : "");
      var inner;
      if (won) inner = '<span class="lvnum">' + l + '</span><span class="lvstars">' + stars(p.stars[l]) + "</span>";
      else if (lost) inner = '<span class="lvnum">' + l + '</span><span class="lvx">✕</span>';
      else inner = '<span class="lvnum">' + l + "</span>";
      html += '<button class="' + cls + '" data-level="' + l + '">' + inner + "</button>";
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
    var lv = opts.level, max = opts.max || PZ.LEVELS;
    // Nothing is locked, so the arrows are simply the neighbouring levels.
    var prevT = lv > 1 ? lv - 1 : null;
    var nextT = lv < max ? lv + 1 : null;
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

  /* ---------- Visitor counts (Cloudflare Web Analytics) ---------- */

  /* Paste the site token from the Cloudflare dashboard here to turn counting
     on. Empty string = analytics fully off, no script, no request — which is
     how the app behaves everywhere the guards below bail out. */
  var CF_BEACON_TOKEN = "ca0b0f8af3044434a39f9dacf22a29ea";

  function loadAnalytics() {
    try {
      if (!CF_BEACON_TOKEN) return;                       // not configured
      var p = location.protocol;
      if (p !== "http:" && p !== "https:") return;        // file:// — nothing to report
      var h = location.hostname;
      if (h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "") {
        return;                                           // keep local testing out of the stats
      }
      if (!document.head) return;
      var s = document.createElement("script");
      // Cloudflare ships beacon.min.js as an ES module; loading it as a
      // classic script would be a parse error. Module scripts defer by default.
      s.type = "module";
      s.src = "https://static.cloudflareinsights.com/beacon.min.js";
      s.setAttribute("data-cf-beacon", JSON.stringify({ token: CF_BEACON_TOKEN }));
      document.head.appendChild(s);
    } catch (e) {
      /* Counting visitors must never be able to break a puzzle. */
    }
  }
  loadAnalytics();

  window.PZ = PZ;
})();
