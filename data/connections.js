/* Pool of themed groups for Connections, tagged by difficulty tier:
   0 = easiest (yellow), 1 = green, 2 = blue, 3 = trickiest (purple).
   Each level draws four non-overlapping groups from a tier window that
   rises with the level number. */
window.CONNECTIONS_GROUPS = [
  // ----- tier 0 (straightforward categories) -----
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
  { d: 0, cat: "Vegetables", words: ["CARROT", "POTATO", "CELERY", "SPINACH"] },
  { d: 0, cat: "Insects", words: ["ANT", "BEE", "MOTH", "WASP"] },
  { d: 0, cat: "Metals", words: ["GOLD", "IRON", "COPPER", "TIN"] },
  { d: 0, cat: "Trees", words: ["OAK", "PINE", "MAPLE", "BIRCH"] },
  { d: 0, cat: "Instruments", words: ["PIANO", "VIOLIN", "FLUTE", "CELLO"] },

  // ----- tier 1 (needs a moment's thought) -----
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
  { d: 1, cat: "Types of soup", words: ["TOMATO", "CHICKEN", "LENTIL", "MISO"] },
  { d: 1, cat: "Martial arts", words: ["JUDO", "KARATE", "SUMO", "AIKIDO"] },
  { d: 1, cat: "Sailing terms", words: ["BOW", "STERN", "MAST", "HULL"] },
  { d: 1, cat: "Gemstones", words: ["RUBY", "PEARL", "OPAL", "JADE"] },
  { d: 1, cat: "Currencies", words: ["DOLLAR", "EURO", "YEN", "PESO"] },

  // ----- tier 2 (compound / prefix wordplay) -----
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
  { d: 2, cat: "Water ___", words: ["MELON", "PROOF", "MARK", "FRONT"] },
  { d: 2, cat: "Snow ___", words: ["BALL", "FLAKE", "MAN", "STORM"] },
  { d: 2, cat: "___ work", words: ["HOME", "NET", "FRAME", "TEAM"] },
  { d: 2, cat: "Book ___", words: ["MARK", "CASE", "SHELF", "WORM"] },
  { d: 2, cat: "___ berry", words: ["BLUE", "STRAW", "BLACK", "RASP"] },

  // ----- tier 3 (twists, hidden words, anagrams) -----
  { d: 3, cat: "___ board", words: ["KEY", "CARD", "SURF", "DASH"] },
  { d: 3, cat: "Words before HOUSE", words: ["LIGHT", "GREEN", "WARE", "OUT"] },
  { d: 3, cat: "Hidden body parts", words: ["SHIN", "EARL", "HIPS", "RIBBON"] },
  { d: 3, cat: "Silent letters", words: ["KNEE", "WRAP", "COMB", "GNOME"] },
  { d: 3, cat: "___ STONE", words: ["LIME", "MILE", "BRIM", "CAP"] },
  { d: 3, cat: "Palindromes", words: ["LEVEL", "KAYAK", "RADAR", "CIVIC"] },
  { d: 3, cat: "Double letters", words: ["BALLOON", "COFFEE", "MIRROR", "PUZZLE"] },
  { d: 3, cat: "___ PIT", words: ["ARM", "COCK", "OUT", "TAR"] },
  { d: 3, cat: "Homophones of letters", words: ["BEE", "SEA", "WHY", "QUEUE"] },
  { d: 3, cat: "TABLE ___", words: ["CLOTH", "SPOON", "TOP", "LAND"] },
  { d: 3, cat: "Anagrams of LISTEN", words: ["SILENT", "TINSEL", "INLETS", "ENLIST"] },
  { d: 3, cat: "___ fly", words: ["BUTTER", "DRAGON", "HORSE", "MAY"] },
  { d: 3, cat: "Hidden animals", words: ["CATALOG", "DOGMA", "RATIO", "OWLET"] },
  { d: 3, cat: "Silent B words", words: ["THUMB", "LAMB", "CRUMB", "DEBT"] },
  { d: 3, cat: "___ cake", words: ["CUP", "PAN", "FISH", "BEEF"] }
];
