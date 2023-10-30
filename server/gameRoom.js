
import bogusMain from "../client/src/common/bogus.js";  //had to add it to React src to be able to share it

export class gameRoom {
    id;
    io;
    players;
    game;
    board;
    output;
    allWordsFound = {};

    constructor(roomId,io,dict) {
        this.io = io;
        this.id = roomId; //nanoid(6);
        console.log("new game room - id is: ",this.id);
        this.game = new bogusMain(dict);
        const tmp = this.game.newBoard();
        this.board = tmp.board;
        this.output = tmp.output;
    }

    newPlayer( player ) {

    }
}
