/* Home page: renders the three puzzle cards with per-game status. */
(function () {
  "use strict";
  PZ.renderNav(null);

  document.getElementById("today").textContent = PZ.prettyDate();

  var META = {
    wordle: {
      icon: "🔤",
      title: "Word Guess",
      desc: "Guess the hidden 5-letter word in six tries."
    },
    connections: {
      icon: "🔗",
      title: "Connections",
      desc: "Sort 16 words into four secret groups of four."
    },
    digits: {
      icon: "🔢",
      title: "Digits",
      desc: "Combine the numbers to reach the target."
    }
  };

  function statusBadges(id) {
    var stats = PZ.getStats(id);
    var daily = PZ.loadDaily(id);
    var out = "";
    if (daily && daily.finished) {
      out += '<span class="badge done">✓ Played today</span>';
    } else if (daily) {
      out += '<span class="badge">In progress</span>';
    } else {
      out += '<span class="badge">Not started</span>';
    }
    if (stats.currentStreak > 0) {
      out += '<span class="badge streak">🔥 ' + stats.currentStreak + ' day streak</span>';
    }
    return out;
  }

  // --- Today's progress + combined completion streak ---
  (function renderProgress() {
    var doneCount = PZ.GAMES.filter(function (g) { return PZ.isDoneToday(g.id); }).length;
    var total = PZ.GAMES.length;
    var combined = PZ.getCombined();
    var allDone = doneCount === total;

    var dots = PZ.GAMES.map(function (g) {
      var done = PZ.isDoneToday(g.id);
      var started = !done && PZ.loadDaily(g.id);
      var cls = done ? "done" : (started ? "partial" : "");
      var mark = done ? "✓" : "";
      return '<a class="prog-dot ' + cls + '" href="' + g.path + '" title="' + META[g.id].title + '">' + mark + '</a>';
    }).join("");

    var headline = allDone
      ? "All done for today! 🎉"
      : doneCount + " of " + total + " puzzles solved today";

    var streakLine = combined.currentStreak > 0
      ? '<div class="prog-streak">🔥 <b>' + combined.currentStreak + '</b> day' +
        (combined.currentStreak === 1 ? "" : "s") + ' completing all three' +
        (combined.maxStreak > combined.currentStreak
          ? ' <span class="prog-best">· best ' + combined.maxStreak + '</span>' : '') +
        '</div>'
      : '<div class="prog-streak dim">Solve all three in a day to start a streak</div>';

    document.getElementById("progress").innerHTML =
      '<div class="prog-top">' +
        '<div class="prog-head">' + headline + '</div>' +
        '<div class="prog-dots">' + dots + '</div>' +
      '</div>' +
      streakLine;
  })();

  var html = PZ.GAMES.map(function (g) {
    var m = META[g.id];
    return '' +
      '<a class="card" href="' + g.path + '">' +
        '<div class="card-top">' +
          '<div class="card-icon">' + m.icon + '</div>' +
          '<div>' +
            '<p class="card-title">' + m.title + '</p>' +
            '<p class="card-desc">' + m.desc + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="card-meta">' +
          statusBadges(g.id) +
          '<span class="card-cta">Play →</span>' +
        '</div>' +
      '</a>';
  }).join("");

  document.getElementById("cards").innerHTML = html;
})();
