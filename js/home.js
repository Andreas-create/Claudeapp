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
    var pct = Math.round((p.cleared / PZ.LEVELS) * 100);
    var stars = PZ.totalStars(g.id);
    var cta = p.cleared === 0 ? "Start →" : p.cleared >= PZ.LEVELS ? "Completed ✓" : "Continue →";
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
            '<span class="badge">' + p.cleared + ' / ' + PZ.LEVELS + ' levels</span>' +
            (stars ? '<span class="badge star">★ ' + stars + '</span>' : '') +
            '<span class="card-cta">' + cta + '</span>' +
          '</div>' +
        '</div>' +
      '</a>';
  }).join("");

  document.getElementById("cards").innerHTML = html;
})();
