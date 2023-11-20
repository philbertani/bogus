import {promises as fs} from 'fs'

export function loadDictionary(cb) {

  const loadData = async (cb) => {
    const { words, definitions } = await loadDict();
    console.log("num words is:", words.length);
    cb(); //execute the callback

    const { hebrewWords, hebrewDefinitions } = await loadHebrewDict();

    const { spanishWords, spanishDefs } = await loadSpanish();

    return { 
            english:{ words, definitions },
            hebrew:{ words:hebrewWords, definitions:hebrewDefinitions},
            spanish:{ words:spanishWords, definitions:spanishDefs }
          };
  };

  const loadDict = async () => {
    try {
      const dictText = await fs.readFile("./lotsOfWords.txt", "utf-8");
      const defs = dictText.replace(/\r/g, "").split(/\n/); //making sure to remove carriage controls first

      const words = [];
      const definitions = [];
      for (let i=0; i<defs.length; i++) {
        const [word,meaning] = defs[i].split(/\t/);
        words.push(word);
        definitions.push(meaning);
      }

      console.log(words[5],definitions[5])
      return { words, definitions };

      //assuming already sorted
    } catch (error) {
      throw error;
    }
  };

  const loadHebrewDict = async () => {
    try {
      const dictText = await fs.readFile("./hebrew.txt", "utf-8");
      const words = dictText.replace(/\r/g, "").split(/\n/); //making sure to remove carriage controls first

      const definitions = [...words];
 
      console.log('hebrew',words[5],definitions[5])

      console.log('Hebrew Words:', words.length);

      return { hebrewWords:words, hebrewDefinitions:definitions };

      //assuming already sorted

    } catch (error) {
      throw error;
    }
  };


  function addToStats(word,stats) {
    let numLetters = 0;
    const letters = Array.from(word);
    for ( const letter of letters) {
      numLetters ++;
      if ( !stats[letter]) stats[letter] = 1;
      else  ( stats[letter] ++ ); 
    }
    return numLetters;
  }

  function removeQuote(str) {
    return str.replace(/"/g,'');
  }

  async function loadSpanishCSV() {
    const header = {
      infinitive: 0,
      infinitive_english: 1,
      mood: 2,
      mood_english: 3,
      tense: 4,
      tense_english: 5,
      verb_english: 6,
      form_1s: 7,
      form_2s: 8,
      form_3s: 9,
      form_1p: 10,
      form_2p: 11,
      form_3p: 12,
      gerund: 13,
      gerund_english: 14,
      pastparticiple: 15,
      pastparticiple_english: 16,
    };

    const spanishForms = [
      "form_1s",
      "form_2s",
      "form_3s",
      "form_1p",
      "form_2p",
      "form_3p"
    ]

    //ignore records that have compound verb tenses
    //we just need the past participle and the gerund
    const ignoreTenses = {
      "Present Perfect": 1,
      "Future Perfect": 1,
      "Past Perfect": 1,
      "Preterite (Archaic)": 1,
      "Conditional Perfect": 1,
      "Present Perfect": 1,
      "Future Perfect": 1,
      "Past Perfect": 1,
    };

    const ignoreMoods = {
      "Imperative Negative": 1,
    };

    const tenseHeader = "tense_english";
    const moodHeader = "mood_english";
    const verbHead = "verb_english";

    //let's add the tense_english, verb_english along with the form_* to the definitions for each form
    //example: abandono , 1s:I abandon,am abandoning

    try {
      const csvText = await fs.readFile("./spanish_verbs.csv", "utf-8");
      const lines = csvText.replace(/\r/g, "").split(/\n/);

      const delim = '","';
      //there may be commas in the quoted fields so use ","  as the separator
      const colNames = lines[0].split(delim);

      //the first and last fields will have extra quotations, get rid of them
      const last = colNames.length - 1;
      colNames[0] = removeQuote(colNames[0]);
      colNames[last] = removeQuote(colNames[last]);

      console.log(colNames);

      let ignoreCount = 0;
      let errCount = 0;
      const words = {},
        defs = {};

      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(delim);

        if (columns.length < 17) {
          errCount ++;
          console.log('ERROR',columns,lines[i],i);
        }
        else if (
          ignoreTenses[columns[header.tense_english]] ||
          ignoreMoods[columns[header.mood_english]]
        ) {
          ignoreCount++;
        } else {

          const  last = columns.length - 1;
          columns[0] = removeQuote(columns[0]);
          columns[last] = removeQuote(columns[last]);

          const inf = columns[header.infinitive].toLocaleUpperCase();
          words[inf] = 1;
          defs[inf] = columns[header.infinitive_english];

          const gerund = columns[header.gerund].toLocaleUpperCase();
          words[gerund] = 1;
          defs[gerund] = "gerund:" + columns[header.gerund_english];

          const pp = columns[header.pastparticiple].toLocaleUpperCase();
          words[pp] = 1;
          defs[pp] = "past particple:" + columns[header.pastparticiple_english];

          for (const form of spanishForms) {
            const word = columns[header[form]].toLocaleUpperCase();
            words[word] = 1;
            defs[word] = columns[header.tense_english] + "," + form + ":" + columns[header.infinitive_english];
          }
        }
      }

      const spanishWords = Array.from(words).sort();

      console.log("Num Records Ignored", ignoreCount);
      console.log("Errors",errCount);

      //throw('shit');

      return {words,defs};

    } catch (err) {
      console.log("something aweful happened loading spanish_verbs.csv", err);
      throw err;
    }
  }

  async function loadSpanish() {
    try {

      //don't over write definitions that already exist when we add to these maps
      const {words, defs} = await loadSpanishCSV();

      const dictText = await fs.readFile("./spanish.txt", "utf-8");
      const lines = dictText.replace(/\r/g, "").split(/\n/); //making sure to remove carriage controls first

      //const words={}, defs={};
  
      let j = 0;

      while (lines[j] && j< 4e5) {

        const info = lines[j].split(/\|/);
        const numRecs = parseFloat(info[1]);

        //console.log(j,lines[j],numRecs,info[1]);

        if (!isNaN(numRecs)) {
          const word = info[0];
          let def = "";

          const moreWords = [];
          for (let i = 0; i < numRecs; i++) {
            def += lines[j + 1 + i];
            moreWords.push( ...lines[j + 1 + i].split(/\|/) );
          }

          for (let i=0; i<moreWords.length; i++) {

            const words2 = moreWords[i];
            if ( words2[0]==="-" || words2[0]==="(") {
              //skip it
            }
            else {
              let finalWord = words2;

              if ( words2.includes('(')) {
                finalWord = words2.split(/\(/)[0];
              }

              const upcase = finalWord.toLocaleUpperCase()
              words[upcase] ? words[upcase] ++ : words[upcase] = 1;
              defs[upcase] = word;
      
            }
          }

          const upcase = word.toLocaleUpperCase();
          words[upcase] ? words[upcase] ++ : words[upcase] = 1;
          defs[upcase] = def;
   
          j += numRecs + 1;
        }
        else {
          break;
        }
    
      }
      
      const stats={};
      let numLetters=0;
      for ( const word of Object.keys(words)) {
        numLetters += addToStats(word, stats);
      }

      //we need sorted arrays for the main program
      const sortedWords = Object.keys(words).sort();
      const sortedDefs = [];
      for (const word of sortedWords) {
        sortedDefs.push( defs[word] );
      }

      console.log("Spanish Words:",sortedWords.length);

      return {spanishWords:sortedWords,spanishDefs:sortedDefs};

    } catch (error) {
      throw error;
    }

  }

  return loadData(cb);
}
