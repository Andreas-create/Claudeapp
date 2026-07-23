/* Pool of themed groups for Connections.
   Each day the game deterministically picks one group from each
   difficulty tier (0 = easiest yellow ... 3 = trickiest purple).
   `d` is the difficulty tier. Words are single tokens, shown uppercased. */
window.CONNECTIONS_GROUPS = [
  // ----- tier 0 (yellow, most straightforward) -----
  { d: 0, cat: "Citrus fruits", words: ["LEMON", "LIME", "ORANGE", "MANGO"] },
  { d: 0, cat: "Colors", words: ["RED", "BLUE", "GREEN", "PINK"] },
  { d: 0, cat: "Farm animals", words: ["COW", "GOAT", "SHEEP", "HORSE"] },
  { d: 0, cat: "Body parts", words: ["ANKLE", "ELBOW", "SHIN", "WRIST"] },
  { d: 0, cat: "Weather", words: ["RAIN", "SNOW", "HAIL", "FOG"] },
  { d: 0, cat: "Breakfast foods", words: ["TOAST", "BACON", "CEREAL", "WAFFLE"] },
  { d: 0, cat: "Playing cards", words: ["ACE", "KING", "QUEEN", "JACK"] },
  { d: 0, cat: "Ocean animals", words: ["WHALE", "SHARK", "CRAB", "SEAL"] },
  { d: 0, cat: "Kitchen tools", words: ["WHISK", "LADLE", "GRATER", "PEELER"] },
  { d: 0, cat: "Planets", words: ["MARS", "VENUS", "SATURN", "NEPTUNE"] },

  // ----- tier 1 (green) -----
  { d: 1, cat: "Card games", words: ["POKER", "BRIDGE", "HEARTS", "RUMMY"] },
  { d: 1, cat: "Types of dance", words: ["SALSA", "TANGO", "SWING", "WALTZ"] },
  { d: 1, cat: "Board games", words: ["CHESS", "SORRY", "RISK", "CLUE"] },
  { d: 1, cat: "Boxing terms", words: ["JAB", "HOOK", "CROSS", "BOB"] },
  { d: 1, cat: "Coffee drinks", words: ["LATTE", "MOCHA", "ESPRESSO", "AMERICANO"] },
  { d: 1, cat: "Chess pieces", words: ["PAWN", "ROOK", "BISHOP", "KNIGHT"] },
  { d: 1, cat: "Units of time", words: ["SECOND", "MINUTE", "HOUR", "WEEK"] },
  { d: 1, cat: "Guitar parts", words: ["FRET", "NECK", "BRIDGE", "STRING"] },
  { d: 1, cat: "Shades of blue", words: ["NAVY", "TEAL", "COBALT", "AZURE"] },
  { d: 1, cat: "Pasta shapes", words: ["PENNE", "ZITI", "FUSILLI", "ROTINI"] },

  // ----- tier 2 (blue) -----
  { d: 2, cat: "___ ball", words: ["BASE", "FOOT", "BASKET", "MEAT"] },
  { d: 2, cat: "Fire ___", words: ["PLACE", "WORK", "FLY", "WOOD"] },
  { d: 2, cat: "Sun ___", words: ["FLOWER", "SHINE", "RISE", "BURN"] },
  { d: 2, cat: "___ light", words: ["DAY", "MOON", "SPOT", "FLASH"] },
  { d: 2, cat: "Rain ___", words: ["BOW", "COAT", "DROP", "FALL"] },
  { d: 2, cat: "Types of bridge", words: ["ARCH", "BEAM", "CABLE", "TRUSS"] },
  { d: 2, cat: "Homophones of numbers", words: ["WON", "TOO", "FOUR", "ATE"] },
  { d: 2, cat: "Poker hands", words: ["FLUSH", "STRAIGHT", "PAIR", "FULL"] },
  { d: 2, cat: "Anagrams of STOP", words: ["POTS", "TOPS", "OPTS", "SPOT"] },
  { d: 2, cat: "Greek letters", words: ["ALPHA", "DELTA", "SIGMA", "OMEGA"] },

  // ----- tier 3 (purple, wordplay / twist) -----
  { d: 3, cat: "___ board", words: ["KEY", "CARD", "SURF", "DASH"] },
  { d: 3, cat: "Words before HOUSE", words: ["LIGHT", "GREEN", "WARE", "OUT"] },
  { d: 3, cat: "Hidden body parts", words: ["SHIN", "EARL", "HIPS", "RIBBON"] },
  { d: 3, cat: "Silent letters", words: ["KNEE", "WRAP", "COMB", "GNOME"] },
  { d: 3, cat: "___ STONE", words: ["LIME", "MILE", "BRIM", "CAP"] },
  { d: 3, cat: "Palindromes", words: ["LEVEL", "KAYAK", "RADAR", "CIVIC"] },
  { d: 3, cat: "Double letters", words: ["BALLOON", "COFFEE", "MIRROR", "PUZZLE"] },
  { d: 3, cat: "___ PIT", words: ["ARM", "COCK", "OUT", "TAR"] },
  { d: 3, cat: "Homophones of letters", words: ["BEE", "SEA", "WHY", "QUEUE"] },
  { d: 3, cat: "TABLE ___", words: ["CLOTH", "SPOON", "TOP", "WARE"] }
];
