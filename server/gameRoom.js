
import bogusMain from "../client/src/common/bogus.js";  //had to add it to React src to be able to share it
import {v4 as uuidv4} from "uuid";

export class gameRoom {
    id;
    io;
    players;
    game;
    board;
    output;
    allWordsFound = {};
    boardId;

    constructor(roomId,io,dict) {
        this.io = io;
        this.id = roomId;
        console.log("new game room - id is: ",this.id);
        this.game = new bogusMain(dict);
        const tmp = this.game.newBoard();
        this.board = tmp.board;
        this.output = tmp.output;
        this.boardId = uuidv4();
    }

    newBoard() {
        const tmp = this.game.newBoard();
        this.board = tmp.board;
        this.output = tmp.output;
        this.boardId = uuidv4();
        this.allWordsFound = {};
    }
    
    newPlayer( player ) {

    }
}
