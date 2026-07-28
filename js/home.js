/* Home page: three game cards, each showing level progress. */
(function () {
  "use strict";
  PZ.renderNav(null);

  var DESC = {
    wordle: "Guess the hidden word. Words get longer and trickier.",
    connections: "Sort 16 words into four groups. Categories get sneakier.",
    digits: "Combine numbers to hit the target. More numbers, bigger targets."
  };

  var html = PZ.GAMES.map(function (g) {
    var p = PZ.getProgress(g.id);
    var won = PZ.wonCount(g.id);
    var total = g.levels || PZ.LEVELS;
    var pct = Math.round((won / total) * 100);
    var stars = PZ.totalStars(g.id);
    var cta = p.reached === 0 ? "Start →" : won >= total ? "Completed ✓" : "Continue →";
    return '' +
      '<a class="card" href="' + g.path + '">' +
        '<div class="card-top">' +
          '<div class="card-icon">' + g.icon + '</div>' +
          '<div class="card-main">' +
            '<p class="card-title">' + g.name + '</p>' +
            '<p class="card-desc">' + DESC[g.id] + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="card-progress">' +
          '<div class="bar"><span style="width:' + pct + '%"></span></div>' +
          '<div class="card-meta">' +
            '<span class="badge">' + won + ' / ' + total + ' solved</span>' +
            (stars ? '<span class="badge star">★ ' + stars + '</span>' : '') +
            '<span class="card-cta">' + cta + '</span>' +
          '</div>' +
        '</div>' +
      '</a>';
  }).join("");

  document.getElementById("cards").innerHTML = html;

  // Themed packs (independent puzzle sets)
  var peru = PZ.getProgress("peru");
  var peruWon = PZ.wonCount("peru");
  var peruStars = PZ.totalStars("peru");
  var PERU_TOTAL = 10;
  var peruPct = Math.round((peruWon / PERU_TOTAL) * 100);
  document.getElementById("packs").innerHTML =
    '<a class="card" href="peru.html">' +
      '<div class="card-top">' +
        '<div class="card-icon">🇵🇪</div>' +
        '<div class="card-main">' +
          '<p class="card-title">Peru Affinity</p>' +
          '<p class="card-desc">Ten hard puzzles on Peruvian history, food, geography, arts and nature.</p>' +
        '</div>' +
      '</div>' +
      '<div class="card-progress">' +
        '<div class="bar"><span style="width:' + peruPct + '%"></span></div>' +
        '<div class="card-meta">' +
          '<span class="badge">' + peruWon + ' / ' + PERU_TOTAL + ' solved</span>' +
          (peruStars ? '<span class="badge star">★ ' + peruStars + '</span>' : '') +
          '<span class="card-cta">' + (peruWon >= PERU_TOTAL ? "Completed ✓" : peru.reached ? "Continue →" : "Play →") + '</span>' +
        '</div>' +
      '</div>' +
    '</a>';

  // Offer "add to your phone" — no-op once Brainbow runs as an installed app.
  PZ.setupInstall(document.getElementById("install-slot"));
})();
