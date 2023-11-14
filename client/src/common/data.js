// ld = letter distribution

const rank = {M:5, N:5}
const minLetters = 4

const gameTypes = {
  four: {
    rank: {M:4, N:4},
    minLetters: 3,
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
    ld: [
      "AAAFRS",
      "AAEEEE",
      "AAFIRS",
      "ADENNN",
      "AEEEEM",
      "AEEGMU",
      "AEGMNN",
      "AFIRSY",
      //"BJKQXZ",
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
  }
}


const ld = {

  //4x4
  old: [
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
  ],

  //4x4
  //not sure if this works well enough for 5x5
  new: [
    //"QQQQQQ",
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
  ],

  //5x5  this distribution actually produces more multi syllable words
  five: [
    "AAAFRS",
    "AAEEEE",
    "AAFIRS",
    "ADENNN",
    "AEEEEM",
    "AEEGMU",
    "AEGMNN",
    "AFIRSY",
    //"BJKQXZ",
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
  ],
};

export {rank, minLetters, ld, gameTypes}
