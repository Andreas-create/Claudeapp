/* Peru Connections pack — 10 fixed, high-difficulty puzzles, all playable
   independently. Hand-authored puzzles from data/peru.js; gameplay lives
   in cn-engine.js. */
(function () {
  "use strict";
  PZ.renderNav("peru");

  var PUZZLES = window.PERU_PUZZLES;

  PZ.connectionsGame({
    game: "peru",
    maxLevels: PUZZLES.length,
    allOpen: true,
    seedPrefix: "peru",
    finalMsg: "You finished the Peru pack! 🇵🇪",
    buildLevel: function (lv) {
      var puzzle = PUZZLES[lv - 1];
      return {
        groups: puzzle.groups,
        mistakes: 4,
        label: "Puzzle " + lv + " · " + puzzle.title
      };
    },
    progressLine: function () {
      return PZ.wonCount("peru") + " / " + PUZZLES.length + " solved · " + PZ.totalStars("peru") + " ★";
    }
  });
})();
