
import bogusMain from "../client/src/common/bogus.js";  //had to add it to React src to be able to share it
import {v4 as uuidv4} from "uuid";

export class gameRoom {
    id;
    io;

    players = {};
    numPlayers = 0;
    playerIndex = {};

    game;
    board;
    output;
    allWordsFound = {};
    boardId;

    BOARDTYPES = {NORMAL:0,TORUS:1};
    boardType;
    maxScore = 0;   //need to persist maxScore separate from users who might disconnect
    stupidMessage = "nobody scored any points - WTF?";
    winner = this.stupidMessage;

    gameType;
    data;
    roomInfo; //set by ioManager

    debugBoard = [];
    

    constructor(roomId,io,dict,boardType,gameType, extraText, debugBoard=[]) {
        this.io = io;
        this.id = roomId;
        this.gameType = gameType;

        console.log("new game room - id is: ",this.id);

        this.game = new bogusMain(dict,boardType,gameType);
        this.data = this.game.data;

        this.debugBoard = debugBoard;

        this.newBoard();

    }

    newBoard() {

        const tmp = this.game.newBoard(this.debugBoard);
        this.board = tmp.board;
        this.output = tmp.output;
        this.boardId = uuidv4();
        this.allWordsFound = {};
        this.maxScore = 0;
        this.winner = this.stupidMessage;

        //set all wordCounts to 0
        for (const player of Object.values(this.players)) {
            player.wordCount = 0;
            player.score = 0;
            player.giveUp = false;
        }
    }
    
    giveUp(userId) {
      this.players[userId].giveUp = true;
      console.log('giving up in:',this.roomInfo.name,this.players[userId]);
    }

    gaveUp(userId) {
      return this.players[userId].giveUp;
    }

    setLatestPlayerTime(userId) {
      this.players[userId].latestTime = Date.now();
    }

    newPlayer( userId, ioManagerRef ) {
      //really newPlayer OR reconnection of previous player
        if (!this.players[userId]) { 
          this.playerIndex[this.numPlayers] = userId;
          this.players[userId] = {playerNum:this.numPlayers++,latestTime:Date.now()};
        }
        else {
          console.log('player reconnecting', userId, this.players[userId]);
        }

        const player=this.players[userId];
        player.connected=true, 
        player.time = Date.now();
        player.name = ioManagerRef ? ioManagerRef.name : 'unknown'; //ioManager reference for player connection data
        //we can not add too much to player obj since it is a networked item

        //am constantly getting burned by the fact that (=0) yields false so not good for checking existence
        if ( !player.hasOwnProperty('wordCount') ) {
          player.wordCount = 0;
          player.score = 0;
          player.giveUp = false;
        }

        console.log(this.players[userId]);
    }

    removePlayer( userId ) {
        const player=this.players[userId];
        player.connected = false;
        player.time = Date.now();      
    }

    gameStats(ioAllPlayers) {
      //check last player time to see if they are actually active
        let playerCount = 0;
        let maxWordCount = 0;
        let maxScore = this.maxScore;
        let winner = this.winner;

        //console.log(ioAllPlayers);
        for ( const [key,value] of Object.entries(this.players) ) {
            if (value.connected) { 
                playerCount ++; 
                //should we still count the score of a disconnected player?
                if (value.wordCount > maxWordCount) maxWordCount = value.wordCount;
                if (value.score > maxScore) { 
                  maxScore = value.score;
                  winner = key
                }
            }

            const userId = key;
            const ioRef = ioAllPlayers ? ioAllPlayers[userId] : null;
            if (ioRef) {
              this.players[userId].name = ioRef.name;
            }
            else {
              console.log("gameStats: could not find ioManagerRef for player, ",userId);
            }
        }

        const ioRef = ioAllPlayers ? ioAllPlayers[winner] : null;
      
        if ( ioRef) {
          winner = ioRef.name;
        }
        
        this.maxScore = maxScore;
        this.winner = winner;
        //console.log(this.id, maxScore);
        return {playerCount, maxWordCount, maxScore, winner, numWords:this.game.wordsFound.length}
    }

    setPlayerWordCount(userId, count, totalScore, ioManagerRef) {
        console.log("stats",userId,count,totalScore);
        this.players[userId].wordCount = count;
        this.players[userId].score = totalScore;
        this.players[userId].name  = ioManagerRef.name;  //may be changing
        return this.players[userId].name;
    }

    sendStats(ioAllPlayers) {
        //console.log("sending stats for",this.id);
        this.io.to(this.id).emit("stats",{stats:this.gameStats(ioAllPlayers),roomId:this.roomInfo.displayId,players:this.players});
    }

    startTimedGame(length) {
      if (this.roomInfo.timedGame) {
        return {status:"alreadyPlaying"}
      }
      this.roomInfo.timedGame = true;
      this.roomInfo.gameStartTime = Date.now();
      this.roomInfo.gameOverTime = Date.now() + length*60*1000;
      this.roomInfo.gameLength = length*60; //coming in as minutes //30;  //500;
      this.roomInfo.gameOver = false;
      this.roomInfo.winner = null;
      this.emittedResult = false;

      return {status:"startGame"}
    }

    checkGame(ioAllPlayers) {
      //let server decide when game is over
      if (this.roomInfo.timedGame) {
        //all time comparisons are in seconds
        const elapsed =  Math.trunc((Date.now() - this.roomInfo.gameStartTime)/1000);
        if (  elapsed >  this.roomInfo.gameLength ) {
          this.roomInfo.gameOver = true;

          //leave some time without other people messing arounnd so we can display results
          this.roomInfo.gameOverTime = Date.now(); 
          this.roomInfo.timedGame = true;
          
          if (!this.emittedResult) {
            const finalResult = this.gameStats(ioAllPlayers);
            this.io.to(this.id).emit("gameOver",{stats:finalResult,roomId:this.roomInfo.displayId,players:this.players})
            this.emittedResult = true;
          }
        }
        if ( elapsed > this.roomInfo.gameLength + 20 ) {
          //finally set timedGame to false so board can be reset
          this.roomInfo.timedGame = false;
        }
      }
    }
}
