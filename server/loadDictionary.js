import {promises as fs} from 'fs'

export function loadDictionary(cb) {

  const loadData = async (cb) => {
    const { words, definitions } = await loadDict();
    console.log("num words is:", words.length);
    cb(); //execute the callback

    const { hebrewWords, hebrewDefinitions } = await loadHebrewDict();

    return { english:{ words, definitions }, hebrew:{words:hebrewWords,definitions:hebrewDefinitions}  };
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

      console.log('ggggggggggggg', words.length);

      return { hebrewWords:words, hebrewDefinitions:definitions };

      //assuming already sorted

    } catch (error) {
      throw error;
    }
  };

  return loadData(cb);
}
