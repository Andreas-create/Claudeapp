/* Word Guess answer bands, ordered roughly easy -> harder within each band.
   Levels 1-40 use 4-letter words, 41-80 use 5-letter, 81-100 use 6-letter. */
window.WORDLE_BANDS = {
  four: [
    "LOVE","TIME","GAME","PLAY","BLUE","TREE","FISH","BIRD","CAKE","MILK",
    "DOOR","BOOK","STAR","MOON","RAIN","SNOW","FIRE","GOLD","KING","SHIP",
    "ROAD","LION","FROG","BEAR","DUCK","WOLF","GOAT","CORN","LEAF","ROSE",
    "SAND","WAVE","WIND","LAMP","RING","COIN","DRUM","KITE","NEST","PALM",
    "REEF","VASE","YARN","QUIZ","JADE","GLOW"
  ],
  five: [
    "APPLE","HOUSE","WATER","MUSIC","LIGHT","HAPPY","GREEN","TRAIN","BREAD","CHAIR",
    "TABLE","PHONE","RIVER","CLOUD","BEACH","PLANT","HEART","SMILE","DANCE","DREAM",
    "TIGER","HORSE","EAGLE","OCEAN","STONE","FLAME","GRAPE","LEMON","ROBIN","OLIVE",
    "PEARL","QUILT","RAVEN","VIVID","WAGON","ZEBRA","AMBER","GLIDE","HAUNT","IVORY",
    "JOKER","KOALA","MIRTH","NIFTY","PLUME"
  ],
  six: [
    "GARDEN","ORANGE","PENCIL","ROCKET","MONKEY","FLOWER","BRIDGE","CASTLE","DRAGON","ISLAND",
    "JUNGLE","MARKET","PLANET","SILVER","WINTER","YELLOW","ANCHOR","BREEZE","CACTUS","FALCON",
    "HAMMER","LIZARD","NEEDLE","PEBBLE","WALNUT"
  ]
};
