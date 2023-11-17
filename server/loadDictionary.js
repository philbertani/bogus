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


  async function loadSpanish() {
    try {

      const dictText = await fs.readFile("./spanish.txt", "utf-8");
      const lines = dictText.replace(/\r/g, "").split(/\n/); //making sure to remove carriage controls first

      const words={}, defs={};
  
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

      /*
      for (const letter of Object.keys(stats) ) {
        console.log(letter, Math.trunc( stats[letter] / numLetters * 10000 ) / 100);
      }
      throw('ending early');
      */

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
