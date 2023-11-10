
import bogusMain from "../client/src/common/bogus.js";  //had to add it to React src to be able to share it
import {v4 as uuidv4} from "uuid";

export class gameRoom {
    id;
    io;
    players = {};
    game;
    board;
    output;
    allWordsFound = {};
    boardId;

    BOARDTYPES = {NORMAL:0,TORUS:1};
    boardType;

    constructor(roomId,io,dict,boardType) {
        this.io = io;
        this.id = roomId;
        console.log("new game room - id is: ",this.id);
        this.game = new bogusMain(dict,boardType);

        this.newBoard();

    }

    newBoard() {
        const tmp = this.game.newBoard();
        this.board = tmp.board;
        this.output = tmp.output;
        this.boardId = uuidv4();
        this.allWordsFound = {};

        //set all wordCounts to 0
        for (const player of Object.values(this.players)) {
            player.wordCount = 0;
            player.score = 0;
        }
    }
    
    newPlayer( userId ) {
        if (!this.players[userId]) this.players[userId] = {};
        const player=this.players[userId];
        player.connected=true, 
        player.time = Date.now();
    }

    removePlayer( userId ) {
        const player=this.players[userId];
        player.connected = false;
        player.time = Date.now();      
    }

    gameStats() {
        let playerCount = 0;
        let maxWordCount = 0;
        let maxScore = 0;
        for ( const [key,value] of Object.entries(this.players) ) {
            if (value.connected) { playerCount ++; 
                if (value.wordCount > maxWordCount) maxWordCount = value.wordCount;
                if (value.score > maxScore) maxScore = value.score;
            }
        }
        return {playerCount, maxWordCount, maxScore, numWords:this.game.wordsFound.length}
    }

    setPlayerWordCount(userId, count, totalScore) {
        this.players[userId].wordCount = count;
        this.players[userId].score = totalScore;
    }

    sendStats() {
        //console.log("sending stats for",this.id);
        this.io.to(this.id).emit("stats",this.gameStats());
    }
}
