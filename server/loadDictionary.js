import {promises as fs} from 'fs'

export function loadDictionary(cb) {

  const loadData = async (cb) => {
    const { words, definitions } = await loadDict();
    this.words = words;
    this.definitions = definitions;
    console.log("num words is:", this.words.length);
    cb(); //execute the callback
  };

  const loadDict = async () => {
    try {
      const dictText = await fs.readFile("./lotsOfWords.txt", "utf-8");
      const definitions = dictText.replace(/\r/g, "").split(/\n/); //making sure to remove carriage controls first
      const words = definitions.map((x) => x.split(/\t/)[0]);

      return { words, definitions };
      //assuming already sorted
    } catch (error) {
      throw error;
    }
  };

  loadData(cb);
}
