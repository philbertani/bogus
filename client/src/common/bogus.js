import * as data from "./data.js";
import { cloneArray, bsearch } from "./utils.js";

class bogusMain {

  board = [];
  output = [];
  indexMap = [];
  wordsFound;
  defsFound;
  words;
  definitions;
  rank = data.rank;
  M = data.rank.M;
  N = data.rank.N;
  BOARDTYPES = {NORMAL:0,TORUS:1};
  boardType = this.BOARDTYPES.NORMAL;

  minLetters = data.minLetters;
  wordFindingFunctions = {};

  constructor(dictionary ) {
    //for server we pass in the whole dictionary
    //for clients we pass in just the words we know are in the word grid
    if (!dictionary.words) {
      //throw new Error("No Words, Halting Evrything");
      console.log("creating bogus with no words");
    } else {
      this.words = dictionary.words;
      this.definitions = dictionary.definitions;
    }

    //assign functions to different elements of array
    this.wordFindingFunctions[this.BOARDTYPES.NORMAL] = this.findWords;
    this.wordFindingFunctions[this.BOARDTYPES.TORUS] = this.findWords2;

    //map from sequential order to board i,j indices so we just have
    //to do this double loop once
    for (let j=0; j<this.N; j++) {
      for (let i=0; i<this.M; i++) {
        this.indexMap.push({i,j});
      }
    }

    //console.log("trying generator function");
    //this.loop();

    return this;
  }

  findWordsDriver(wordFindingFunction=this.findWords) {

    this.allStr = [];
    this.uniquePaths = new Set();
    this.wordsFound = new Set();

    for (let j=0; j<this.N; j++) {
      for (let i=0; i<this.M; i++) {
        const visited = Array.from(Array(this.rank.M), () =>
          new Array(this.rank.N).fill(false));
        let str="";
        let k=0;
        wordFindingFunction.call(this, cloneArray(this.board), visited, i, j, str, k);
      }
    }

    this.wordsFound = Array.from(this.wordsFound).sort();  //don't forget the sort for bsearch!!!
    
    console.log("num words found: ", this.wordsFound.length);

    //javascript array methods are great but sometimes you need to loop through one big
    //array and do lots of stuff and have multiple outputs for efficiency sake, so: for loop
    this.defsFound = [];
    for (let i=0; i<this.wordsFound.length; i+=6) {
      let output = "";
      for (let j=0; j<6; j++) {
        if ( i+j < this.wordsFound.length ) {
          const k = i + j;
          const word = this.wordsFound[k];
          const index = bsearch(this.words,word);
          //console.log(index);
          if (index[1]===false) {
            //should not happen
            console.log("something is wrong with the data:", )
            this.defsFound.push('xxx');
          }
          else {
            const ii = index[3];  //final index of bsearch is returned in element 3 
            this.defsFound.push(this.definitions[ii]);
          }
          output += k + " " + this.wordsFound[k] + "\t";
        }
      }
      console.log(output +"\n");
    }

    //console.log("zzz", this.wordsFound[40],this.defsFound[40]);
  }

  isWord(str,debug=false) {
    //console.log("searching for:",str," in:",this.words)
    return bsearch(this.words, str, debug);
  }

  findWords(grid, visited, i, j, str, k) {
    //this is the smarter search loop, using the dictionary to bail out if the
    //accumulated string including the next letter is not part of the beginning
    //of a word or a whole word

    k++;
    visited[i][j] = true;
    const letter = grid[i][j];
    str = str + letter;

    //this.allStr.push(str)
    //this.uniquePaths.add(str)  //useful for debugging
    const search = this.isWord(str);
    //console.log(str, search);
    //search[0] is true if we found a closest match, search[1] is true if exact word match

    if (search[1] && str.length >= this.minLetters) {
      this.wordsFound.add(str);
    }

    const [M, N] = [this.rank.M, this.rank.N];

    //do not interchange the order of the loops here
    //the board displayed will not match the words found!!!
    for (let row = i-1; row <= i+1 && row < M; row++) {
      for (let col = j-1; col <= j+1 && col < N; col++) {

        if (row >= 0 && col >= 0 && !visited[row][col]) {
          const checkNext = str + grid[row][col];
          const search = this.isWord(checkNext);
          if (search[0]) {
            //if we DON'T do this we get extra searching on the order
            //of 500k to 1MM per grid element!!! 10k more per path, nasty unchecked recursion
            this.findWords(grid, visited, row, col, str, k);
          }
        }
      }
    }

    str = "" + str[str.length - letter.length];
    visited[i][j] = false;
  }

  findWords2(grid, visited, i, j, str, k) {
    //this is the smarter search loop, using the dictionary to bail out if the
    //accumulated string including the next letter is not part of the beginning
    //of a word or a whole word

    //for torus we need to maintain the sign of i and j through recursion
    k++;
    const ix = pmod(i,4);
    const jx = pmod(j,4);

    visited[ix][jx] = true;
    const letter = grid[ix][jx];
    str = str + letter;

    //this.allStr.push(str)
    //this.uniquePaths.add(str)  //useful for debugging
    const search = this.isWord(str);
    //console.log(str);  //, search);
    //search[0] is true if we found a closest match, search[1] is true if exact word match

    if (search[1] && str.length >= this.minLetters) {
      this.wordsFound.add(str);
    }

    //const [M, N] = [this.rank.M, this.rank.N];

    function pmod(x,y) {
      //% for negative numbers still gives negative, 
      //need to add the modulus back to result
      const a = x%y;
      return a<0 ? a+y : a;
    }

    for (let row = i-1; row <= i+1 ; row++) {
      for (let col = j - 1; col <= j + 1 ; col++) {
        const rx = pmod(row,4);
        const cx = pmod(col,4);

        if (!visited[rx][cx]) {
          const checkNext = str + grid[rx][cx];
          const search = this.isWord(checkNext);
          if (search[0]) {
            //if we DON'T do this we get extra searching on the order
            //of 500k to 1MM per grid element!!! 10k more per path, nasty unchecked recursion
            this.findWords2(grid, visited, row, col, str, k);
          }
        }
      }
    }

    str = "" + str[str.length - letter.length];
    visited[ix][jx] = false;
  }

  debugBoard(manualBoard) {
    console.log("******* start debugging manual board ************");
    this.board = cloneArray(manualBoard);
    console.log(this.board);

    //this.findWordsDriver();
    //console.log (this.isWord('GO'));

    this.wordsFound = new Set();
    const visited = Array.from(Array(this.rank.M), () =>
    new Array(this.rank.N).fill(false));

    this.allStr = [];
    let str="";
    let k=0;
    this.findWords(cloneArray(this.board), visited, 3, 0, str, k);    

    console.log(this.wordsFound);
    console.log(this.allStr);

    console.log("****************** end **************************")
    this.board = [];
  }

  newBoard() {
    
    this.makeBoard();

    const BOARDTYPE = this.BOARDTYPES.NORMAL;
    //const BOARDTYPE = this.boardTypes[TORUS];
    this.findWordsDriver(this.wordFindingFunctions[BOARDTYPE]);

    //console.log("trying generator function");
    //this.loop( (i,j)=>{ console.log(this.board[i][j])} );

    return {board:this.board,output:this.output};
  }

  boardsAreSame(otherBoard) {

    console.log(this.board, otherBoard)
    this.loop( (i,j)=> { 
      console.log( i,j );
    })
    return false;

  }

  *nextIndex(n) {
    while (n<this.M*this.N) {
      yield this.indexMap[n++];
    }
  }
  
  loop(cb) {
    let n=0;
    for (let X of this.nextIndex(n)) {
      console.log(X);
      if (cb) cb(X.i,X.j);
    }
    return null;
  }

  makeBoard() {
    const TYPE = "new"; //old vs new boggle letter distribution
    const letters = data.ld[TYPE];

    let dieNum = 0;
    //randomize the sequence of iteration through the dice
    const randomOrder = Array.from({length:letters.length},()=>Math.random());
    const order = Array.from({length:letters.length},(x,i)=>i);
    //console.log(randomOrder);
    //console.log(order);

    order.sort( (l,r)=>randomOrder[l]-randomOrder[r]);
    //console.log(order);

    this.board = [];
    this.output = [];

    for (let i = 0; i < this.rank.M; i++) {
      this.board.push([]);
      this.output.push([]);
      for (let j = 0; j < this.rank.N; j++) {
        const select = Math.trunc(Math.random() * 6);

        //order[dieNum] gives us the dice in random order
        const letter = letters[order[dieNum]][select];
        this.board[i][j] = letter;
        this.output[i][j] = letter;
        if (letter === "Q") {
          this.board[i][j] = "QU";
          //eslint has a problem but there is nothing wrong with the following:
          this.output[i][j] = "Q" + "\u1d64" ; //"\&#7524" //a subscript u
        }
        dieNum++;
      }
    }

    //console.log(this.board);
    console.log(this.output);
  }

  isValidMove(i,j,prevSelected) {
    const [iOld,jOld] = prevSelected;

    //another inelegant function
    let iOk = false;
    let jOk = false;

    if (i===iOld && j===jOld) return false;
    
    if ( iOld===0 ) {
        if ( i-iOld <= 1 ) {
            iOk = true;
        }
    }
    else if (iOld===this.M) {
        if ( iOld - i <= 1) {
            iOk = true;
        }
    }
    else if ( Math.abs(i-iOld) <= 1) {
        iOk = true;
    }

    if ( jOld===0 ) {
        if ( j-jOld <= 1 ) {
            jOk = true;
        }
    }
    else if (jOld===this.N) {
        if ( jOld - j <= 1) {
            jOk = true;
        }
    }
    else if ( Math.abs(j-jOld) <= 1) {
        jOk = true;
    }
    return (iOk && jOk);
  }


}

export default bogusMain;
