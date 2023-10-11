import {promises as fs} from 'fs'

export function loadDictionary(cb) {

  const loadData = async (cb) => {
    const { words, definitions } = await loadDict();
    //this.words = words;
    //this.definitions = definitions;
    console.log("num words is:", words.length);
    cb(); //execute the callback
    return { words, definitions };
  };

  const loadDict = async () => {
    try {
      const dictText = await fs.readFile("./lotsOfWords.txt", "utf-8");
      const defs = dictText.replace(/\r/g, "").split(/\n/); //making sure to remove carriage controls first

      //const defs = definitions.map(x => x.split(/\t/));

      //const words = definitions.map((x) => x.split(/\t/)[0]);

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

  return loadData(cb);
}
