/* Peruvian Connections pack — 5 hand-authored, high-difficulty puzzles.
   Each puzzle has four groups of four; `d` (0=yellow easiest … 3=purple
   trickiest) sets the reveal colour. Trap words are chosen so several
   tiles look like they belong to more than one group. */
window.PERU_PUZZLES = [
  {
    title: "Ancient Peru",
    groups: [
      { d: 0, cat: "Inca emperors", words: ["PACHACUTI", "ATAHUALPA", "HUASCAR", "MANCO"] },
      { d: 1, cat: "Pre-Inca cultures", words: ["MOCHE", "NAZCA", "CHAVIN", "PARACAS"] },
      { d: 2, cat: "Inca sites near Cusco", words: ["SACSAYHUAMAN", "OLLANTAYTAMBO", "PISAC", "CORICANCHA"] },
      { d: 3, cat: "English words from Quechua", words: ["LLAMA", "CONDOR", "PUMA", "JERKY"] }
    ]
  },
  {
    title: "Peruvian Kitchen",
    groups: [
      { d: 0, cat: "Classic dishes", words: ["CEVICHE", "CAUSA", "ANTICUCHO", "TIRADITO"] },
      { d: 1, cat: "Drinks", words: ["PISCO", "CHICHA", "CHILCANO", "INCA"] },
      { d: 2, cat: "Andean tubers", words: ["PAPA", "OCA", "OLLUCO", "YUCA"] },
      { d: 3, cat: "Aji & other flavourings", words: ["ROCOTO", "HUACATAY", "CHOCLO", "QUINOA"] }
    ]
  },
  {
    title: "Map of Peru",
    groups: [
      { d: 0, cat: "Coastal cities", words: ["LIMA", "TRUJILLO", "CHICLAYO", "PIURA"] },
      { d: 1, cat: "Highland cities", words: ["CUSCO", "AREQUIPA", "PUNO", "HUARAZ"] },
      { d: 2, cat: "Amazon rivers", words: ["AMAZON", "UCAYALI", "MARANON", "URUBAMBA"] },
      { d: 3, cat: "Natural landmarks", words: ["TITICACA", "COLCA", "MISTI", "HUASCARAN"] }
    ]
  },
  {
    title: "Sound & Craft",
    groups: [
      { d: 0, cat: "Instruments", words: ["CAJON", "ZAMPONA", "CHARANGO", "QUENA"] },
      { d: 1, cat: "Traditional dances", words: ["MARINERA", "HUAYNO", "FESTEJO", "TONDERO"] },
      { d: 2, cat: "Andean garments", words: ["PONCHO", "CHULLO", "MANTA", "OJOTA"] },
      { d: 3, cat: "Famous Peruvians", words: ["VARGAS", "SUMAC", "ACURIO", "GUERRERO"] }
    ]
  },
  {
    title: "Andes & Amazon",
    groups: [
      { d: 0, cat: "Camelids", words: ["LLAMA", "ALPACA", "VICUNA", "GUANACO"] },
      { d: 1, cat: "Amazon animals", words: ["JAGUAR", "ANACONDA", "PIRANHA", "CAIMAN"] },
      { d: 2, cat: "Crops domesticated in Peru", words: ["POTATO", "MAIZE", "QUINOA", "COCA"] },
      { d: 3, cat: "Other Andean wildlife", words: ["CONDOR", "VIZCACHA", "TARUCA", "CUY"] }
    ]
  }
];
