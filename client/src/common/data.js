// ld = letter distribution


const gameTypes = {
  four: {
    rank: {M:4, N:4},
    minLetters: 3,
    name: "English 4x4",
    ld: [
      "AAEEGN",
      "ABBJOO",
      "ACHOPS",
      "AFFKPS",
      "AOOTTW",
      "CIMOTU",
      "DEILRX",
      "DELRVY",
      "DISTTY",
      "EEGHNW",
      "EEINSU",
      "EHRTVW",
      "EIOSST",
      "ELRTTY",
      "HIMNUQu",
      "HLNNRZ",
    ]
  },

  five: {
    rank: {M:5, N:5},
    minLetters: 4,
    name: "English 5x5",
    ld: [
      "AAAFRS",
      "AAEEEE",
      "AAFIRS",
      "ADENNN",
      "AEEEEM",
      "AEEGMU",
      "AEGMNN",
      "AFIRSY",
      "BJKXZQU",
      "CCNSTW",
      "CEIILT",
      "CEILPT",
      "CEIPST",
      "DHHNOT",
      "DHHLOR",
      "DHLNOR",
      "DDLNOR",
      "EIIITT",
      "EMOTTT",
      "ENSSSU",
      "FIPRSY",
      "GORRVW",
      "HIPRRY",
      "NOOTUW",
      "OOOTTU",
    ]
  },

  hebrewFive: {
    rank: {M:5, N:5},
    minLetters: 3,
    name: "Hebrew 5x5",
    prefixes: {"ה":1,"ל":1},  //adding these to beginning forms new words
    prefixMeaning: ["the","to"],
    ld: [
      "הההפוב",
      "ההיייץ",
      "ההפלוב",
      "הםיתתת",
      "הייייכ",
      "הייחכע",
      "היחכתת",
      "הפלובס",
      "קךגצןף",
      "ששתברז",
      "שיללמר",
      "שילמנר",
      "שילנבר",
      "םדדתאר",
      "םדדמאו",
      "םדמתאו",
      "םםמתאו",
      "ילללרר",
      "יכאררר",
      "יתבבבע",
      "פלנובס",
      "חאווטז",
      "דלנווס",
      "תאארעז",
      "אאאררע"
    ]
    
  },

  spanishFive: {
    rank: {M:5, N:5},
    minLetters: 3,
    name: "Spanish 5x5",
    ld: [
      "YRRVET",
      "RRAAAÁ",
      "RRVOET",
      "RUACCC",
      "RAAAÑP",
      "RAAGPD",
      "RAGPCC",
      "RVOETÓ",
      "FXZÍÁQU",
      "SSCTNH",
      "SAOOLN",
      "SAOLMN",
      "SAOMTN",
      "UBBCIN",
      "UBBLIE",
      "UBLCIE",
      "UULCIE",
      "AOOÜNN",
      "APINNN",
      "ÉCTTTD",
      "VOMETÓ",
      "GIEEJH",
      "BOMEEÓ",
      "CIINDH",
      "ÚIINND"
    ]
  },

  spanishFiveLoose: {
    rank: {M:5, N:5},
    minLetters: 3,
    name: "Spanish 5x5 No Accents",

    ld: [
      "YRRVET",
      "RRAAAA",
      "RRVOET",
      "RUACCC",
      "RAAAÑP",
      "RAAGPD",
      "RAGPCC",
      "RVOETO",
      "FXZIAQU",
      "SSCTNH",
      "SAOOLN",
      "SAOLMN",
      "SAOMTN",
      "UBBCIN",
      "UBBLIE",
      "UBLCIE",
      "UULCIE",
      "AOOUNN",
      "APINNN",
      "ECTTTD",
      "VOMETO",
      "GIEEJH",
      "BOMEEO",
      "CIINDH",
      "UIINND"
    ]
  }

}

/*

old 4x4
    "AACIOT",
    "ABILTY",
    "ABJMOQu",
    "ACDEMP",
    "ACELRS",
    "ADENVZ",
    "AHMORS",
    "BIFORX",
    "DENOSW",
    "DKNOTU",
    "EEFHIY",
    "EGKLUY",
    "EGINTV",
    "EHINPS",
    "ELPSTU",
    "GILRUW",


//we can make up letter distributions in other languages 
//by comparing its letter freq list vs english and then
//comparing versus the english distributions above
const englishFreq = {	
E: 11.1607, 
A: 8.4966,
R: 7.5809,
I: 7.5448,
O: 7.1635,
T: 6.9509,
N: 6.6544,
S: 5.7351,
L: 5.4893,
C: 4.5388,
U: 3.6308,
D: 3.3844,
P: 3.1671,
M: 3.0129,	
H: 3.0034,
G: 2.4705,
B: 2.0720,
F: 1.8121,
Y: 1.7779,
W: 1.2899,
K: 1.1016,
V: 1.0074,
X: 0.2902,
Z: 0.2722,
J: 0.1965,
Q: 0.1962
}

hebrew 5x5
"הההפוב",
"ההיייץ",
"ההפלוב",
"הםיתתת",
"הייייכ",
"הייחכע",
"היחכתת",
"הפלובס",
"קךגצןף",
"ששתברז",
"שיללמר",
"שילמנר",
"שילנבר",
"םדדתאר",
"םדדמאו",
"םדמתאו",
"םםמתאו",
"ילללרר",
"יכאררר",
"יתבבבע",
"פלנובס",
"חאווטז",
"דלנווס",
"תאארעז",
"אאאררע"


*/


export {gameTypes}
