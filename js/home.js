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
