import * as data from "./data.js";
import { cloneArray, bsearch } from "./utils.js";

class bogusMain {

  board = [];
  boardId;
  output = [];
  indexMap = [];
  wordsFound;
  defsFound;
  words;
  definitions;

  rank; //= data.rank;
  M;    //= data.rank.M;
  N;    //= data.rank.N;
  minLetters; // = data.minLetters;

  //gameTypes are keyed by "four" and  "five"
  gameType;
  data;

  BOARDTYPES = {NORMAL:0,TORUS:1};
  BOARDTYPE_NAMES = ["GRID","TORUS"];

  boardType; 
  //maybe add an option to build a board based on 2 or 3 nice long
  //words

  wordFindingFunctions = {};

  constructor( dictionary, boardType,  gameType="five" ) {
    //for server we pass in the whole dictionary
    //for clients we pass in just the words we know are in the word grid
    if (!dictionary.words) {
      //throw new Error("No Words, Halting Evrything");
      console.log("creating bogus with no words");
    } else {
      this.words = dictionary.words;
      this.definitions = dictionary.definitions;
      if ( dictionary.letterDist) {
        this.letterDist = dictionary.letterDist;
        console.log("found an automated letter distribution");
        //process.exit();
      }
    }

    console.log('gameType',gameType);

    this.gameType = gameType;
    const gameData = data.gameTypes[gameType];
    this.data = gameData;
    this.rank = gameData.rank;
    this.minLetters = gameData.minLetters;
    this.M = this.rank.M;
    this.N = this.rank.N;
    this.ld = gameData.ld;  //letter distribution - the "dice"

    this.boardType = boardType;
    //assign functions to different elements of array
    this.wordFindingFunctions[this.BOARDTYPES.NORMAL] = this.findWords;
    this.wordFindingFunctions[this.BOARDTYPES.TORUS] = this.findWords2;

    //console.log("ranky",this.rank);
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
    this.paths = {};

    for (let j=0; j<this.N; j++) {
      for (let i=0; i<this.M; i++) {
        const visited = Array.from(Array(this.rank.M), () =>
          new Array(this.rank.N).fill(false));
        let str="";
        let path=[];
        let k=0;
        wordFindingFunction.call(this, cloneArray(this.board), visited, i, j, str, k, path);
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

    console.log("minimum letters to find: ",this.minLetters);
    //console.log("zzz", this.wordsFound[40],this.defsFound[40]);
  }

  isWord(str,debug=false) {
    //console.log("searching for:",str," in:",this.words)
    return bsearch(this.words, str, debug);
  }

  findWords(grid, visited, i, j, str, k, path) {
    //this is the smarter search loop, using the dictionary to bail out if the
    //accumulated string including the next letter is not part of the beginning
    //of a word or a whole word

    k++;
    visited[i][j] = true;
    const letter = grid[i][j];
    str = str + letter;

    path.push([i,j]);
    //this.allStr.push(str)
    //this.uniquePaths.add(str)  //useful for debugging
    const search = this.isWord(str);
    //console.log(str, search);
    //search[0] is true if we found a closest match, search[1] is true if exact word match

    if (search[1] && str.length >= this.minLetters) {
      this.wordsFound.add(str);
      this.paths[str] = cloneArray(path);
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
            this.findWords(grid, visited, row, col, str, k, path);
          }
        }
      }
    }

    str = "" + str[str.length - letter.length];
    path = path.pop();  //same logic as str - set it to the last one found

    visited[i][j] = false;
  }

  
  //TORUS version of findWords
  findWords2(grid, visited, i, j, str, k, path) {
    //this is the smarter search loop, using the dictionary to bail out if the
    //accumulated string including the next letter is not part of the beginning
    //of a word or a whole word

    const [M, N] = [this.rank.M, this.rank.N];

    //for torus we need to maintain the sign of i and j through recursion
    k++;
    const ix = pmod(i,M);  //why doesn't % function just work the way A mod B is supposed to work?
    const jx = pmod(j,N);

    visited[ix][jx] = true;
    const letter = grid[ix][jx];
    str = str + letter;

    //keep track of the unique path taken through the board so we can display it later
    //or determine if torus moves were used
    path.push([ix,jx]);  

    this.allStr.push(str)
    //this.uniquePaths.add(str)  //useful for debugging
    const search = this.isWord(str);

    //console.log(str);  //, search);
    //a modified bsearch which returns the closest match is essential 
    //we need to know whether the searchstring is a Word or the preFix for a Word
    //search[0] is true if we found a closest match, search[1] is true if exact word match

    if (search[1] && str.length >= this.minLetters) {
      this.wordsFound.add(str);
      this.paths[str] = cloneArray(path);
    }

    function pmod(x,y) {
      //% for negative numbers still gives negative, 
      //need to add the modulus back to result
      const a = x%y;
      return a<0 ? a+y : a;
    }

    for (let row = i-1; row <= i+1 ; row++) {

      for (let col = j-1; col <= j+1 ; col++) {

        const rx = pmod(row,M);
        const cx = pmod(col,N);

        //console.log(row,col,rx,cx);

        if (!visited[rx][cx]) {
          const checkNext = str + grid[rx][cx];
          const search = this.isWord(checkNext);
          if (search[0]) {
            //if we DON'T do this we get extra searching on the order
            //of 500k to 1MM per grid element!!! 10k more per path, nasty unchecked recursion
            //this.findWords2(grid, visited, row, col, str, k);
            this.findWords2(grid, visited, row, col, str, k, path);
          }
        }
      }
    }

    str = "" + str[str.length - letter.length];  //letter.length accounts for Qu basically

    path = path.pop();

    visited[ix][jx] = false;
  }

  debugBoard() {

    const manualBoard = 
    [
      [ 'M', 'F', 'A', 'E', 'E' ],
      [ 'N', 'T', 'A', 'E', 'V' ],
      [ 'O', 'D', 'S', 'T', 'R' ],
      [ 'N', 'R', 'L', 'I', 'N' ],
      [ 'C', 'T', 'Qᵤ', 'A', 'O' ]
    ];
        
    console.log("******* start debugging manual board ************");
    this.board = cloneArray(manualBoard);
    console.log(this.board);

    //this.findWordsDriver();
    //console.log (this.isWord('GO'));

    this.wordsFound = new Set();
    this.paths = {};

    const visited = Array.from(Array(this.rank.M), () =>
    new Array(this.rank.N).fill(false));

    this.allStr = [];
    let str="";
    let k=0;
    let path=[];

    console.log(this.rank);
    //findwords2 is for TORUS type of board
    this.findWords2( cloneArray(this.board), visited, 0, 0, str, k, path);    

    console.log(this.wordsFound);
    console.log(this.allStr);

    console.log("****************** end **************************")
    this.board = [];
  }

  newBoard(debugBoard=[]) {
    if ( debugBoard.length > 0) {
      //we want to be able 
      this.board = cloneArray(debugBoard);
      this.output = cloneArray(debugBoard);
      
      console.log ("using debug board",debugBoard);
    }
    else {
      this.makeBoard();
    }

    this.findWordsDriver(this.wordFindingFunctions[this.boardType]);
    return {board:this.board,output:this.output};
  }

  boardsAreSame(otherBoard) {

    //console.log("trying generator function");
    //this.loop( (i,j)=>{ console.log(this.board[i][j])} );

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

  mod(x,y) {
    //% for negative numbers still gives negative, 
    //need to add the modulus back to result
    const a = x%y;
    return a<0 ? a+y : a;
  }

  makeBoard2() {

    console.log("making board using automated letter dist process");

    this.board = [];
    this.output = [];

    const maxIndex = this.letterDist.length-1;

    for (let i = 0; i < this.rank.M; i++) {
      this.board.push([]);
      this.output.push([]);
      for (let j = 0; j < this.rank.N; j++) {
        const select = Math.trunc(Math.random() * (maxIndex+1) );

        const letter = this.letterDist[ Math.min(maxIndex, select)];
        this.board[i][j] = letter;
        this.output[i][j] = letter;
        if (letter === "Q") {
          this.board[i][j] = "QU";
          //eslint has a problem but there is nothing wrong with the following:
          this.output[i][j] = "Q" + "\u1d64" ; //"\&#7524" //a subscript u
        }
      }
    }

    console.log(this.output);
    console.log("made with automated letter distribution");

  }

  makeBoard() {

    //if we have a good automated letter distribution, use it
    if ( this.letterDist) return this.makeBoard2();

    //const TYPE = "five"; //old vs new boggle letter distribution vs 5x5 (five)
    //const letters = data.ld[TYPE];
    const letters = this.ld;  //should rename this to "dice"

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

    //console.log("boardType", this.boardType);

    if (this.boardType === this.BOARDTYPES.NORMAL) {
      const [iOk,jOk] = this.isValidMoveRegular(i,j,prevSelected);
      return [iOk && jOk, false, [i,j,prevSelected]];
    }
    else if (this.boardType === this.BOARDTYPES.TORUS) {
      return this.isValidMoveTorus(i,j,prevSelected);
    }
  }

  isValidMoveRegular(i,j,prevSelected) {

    const [iOld,jOld] = prevSelected;
    //another inelegant function
    let iOk = false;
    let jOk = false;

    if (i===iOld && j===jOld) return [false, false];
      
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

    //return (iOk && jOk);
    return [iOk,jOk];
  }

  isValidMoveTorus(i,j,prevSelected) {

    let [iOk, jOk] = this.isValidMoveRegular(i,j,prevSelected);

    if ( iOk && jOk ) return [true, false];

    //we need the iOk and jOk tests from this.isValidRegularMove()
    //console.log("testing for torus move", iOk, jOk);

    const [ iOk2, jOk2] = [iOk, jOk];

    const [iOld, jOld] = prevSelected;
   
    const [M, N] = [this.rank.M, this.rank.N];
 
    let torusMove = false;

    let cc = 0;

    if (iOld === 0) {
      cc=1;
      if ( this.mod(iOld-1,M) === i ) { cc=2; iOk = true; torusMove=true; }
    }
    else if (iOld === M-1) {
      cc=3;
      if ( this.mod(iOld+1,M) === i ) { cc=4; iOk = true; torusMove=true; }
    }
    if (jOld === 0) {
      if ( this.mod(jOld-1,N) === j ) { jOk = true; torusMove=true; }
    }
    else if (jOld === N-1) {
      if ( this.mod(jOld+1,N) === j ) { jOk = true; torusMove=true; }
    }
    
    //console.log("torus move", iOk, jOk, i, iOld, j, jOld);

    return [iOk && jOk, torusMove, [iOk,jOk,iOk2,jOk2,M,N,cc]];
    
  }

}

export default bogusMain;
