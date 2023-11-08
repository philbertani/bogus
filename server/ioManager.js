import { gameRoom } from "./gameRoom.js";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

export class ioManager {

  users = {};
  socketMap = {}; //map  of socket ids to unique user ids
  userIdSockets = {}; //list of sockets open by unique user id (should be no more than 2)
  numUsers = 0;
  io = null;
  gameRooms = {};
  roomMap = {};
  numRooms = 0;

  constructor(http, dict) {
    try {
      this.io = new Server(http, {
        cors: { origin: "*", methods: ["GET", "POST"] },
      });

      this.setHandlers(this.io);
      const newRoomId = uuidv4();
      this.gameRooms[newRoomId] = new gameRoom(newRoomId, this.io, dict) ;
      this.roomMap[this.numRooms] = newRoomId;

      //add a gameRoom for testing, so we don't interfere with ongoing games

    } catch (error) {
      console.log("shit", error);
    }
  }

  setHandlers(io) {
    
    io.on("connection", (socket) => {
      console.log("connected a user on socket:", socket.id);
    });

    io.on("connection", (socket) => {
      socket.on("chat message", (msg) => {
        io.emit("chat message", msg);
        console.log(msg);
      });
    });

    io.on("connection", socket=> {
      socket.on("word", msg => {

        //need to get roomId based on userId = socketMap[socket.id]
        const gameRoom = this.gameRooms[this.roomMap[0]];
        console.log(Date.now(),"word found by",socket.id,"in room 0", msg);

        if (gameRoom.allWordsFound[msg]) { 
          gameRoom.allWordsFound[msg] ++ ;
        }
        else {
          gameRoom.allWordsFound[msg] = 1;
        }

        //console.log(gameRoom.allWordsFound);
        io.to(gameRoom.id).emit('allWordsFound',gameRoom.allWordsFound);
      });
    });

    io.on("connection", (socket) => {
      socket.on("new board", (msg) => {

        const userId = this.socketMap[socket.id];
        console.log("new board requested by",this.users[userId]);

        if (this.users[userId]) {

          //this block of code is repeated in "current board" event function
          const roomId = this.users[userId].roomId;
          const gameRoom = this.gameRooms[roomId];
          //console.log("game room is:",gameRoom);
          gameRoom.newBoard();

          io.to(gameRoom.id).emit("current board", {
            game: {
              board: gameRoom.board,
              output: gameRoom.output,
            },
            words: gameRoom.game.wordsFound,
            defs: gameRoom.game.defsFound,
            boardId: gameRoom.boardId
          });
  
          io.to(gameRoom.id).emit("allWordsFound",gameRoom.allWordsFound);


        }
        else {
          console.log('weird could not find user:',userId);
        }

      });
    });

    io.on("connection", (socket) => {
      socket.on("disconnect", (reason) => {
        //on disconnect all we have is the socket id
        console.log("disconnected: ", socket.id);
        const userId = this.socketMap[socket.id];
        if (userId) {
          this.users[userId].sessionId = null;
        } else {
          //weird
          console.log("could not find a userId for socket:", socket.id);
          delete this.socketMap[socket.id];
          return;
        }

        const userSockets = this.userIdSockets[userId];
        const newSocketList = [];
        for (const userSocket of userSockets) {
          if (userSocket.id === socket.id) {
            //this is the one to delete
            delete this.socketMap[socket.id];
          } else {
            newSocketList.push(userSocket);
          }
        }
        this.userIdSockets[userId] = newSocketList;
      });
    });

    io.on("connection", (socket) => {
      socket.on("current board", (msg) => {
        let seqno;
        const time = Date.now();
        if (this.users[msg.userId]) {
          console.log(time, msg.userId, "has connected previously");
          seqno = this.users[msg.userId].seqno;
        } else {
          seqno = this.numUsers;
          this.numUsers++;
        }
        this.users[msg.userId] = {
          sessionId: msg.sessionId,
          connTime: time,
          seqno: seqno,
          socketId: socket.id,
          roomId: this.gameRooms[this.roomMap[0]].id
        };

        const gameRoom = this.gameRooms[this.roomMap[0]];

        if (
          this.userIdSockets[msg.userId] &&
          this.userIdSockets[msg.userId].length > 0
        ) {
          console.log(time, "already has an active socket");

          if (this.socketMap[socket.id]) {
            console.log("already in socket map");
          } else {
            this.socketMap[socket.id] = msg.userId;
            io.to(socket.id).emit("duplicate");
            return;
          }

          this.userIdSockets[msg.userId].push({ id: socket.id, active: false });
        } else {
          this.userIdSockets[msg.userId] = [{ id: socket.id, active: true }];
          this.socketMap[socket.id] = msg.userId;
          gameRoom.newPlayer(msg.userId);
        }

        socket.join( gameRoom.id );
    
        //figure out which game room this person belongs to
        io.to(socket.id).emit("current board", {
          game: {
            board: gameRoom.board,
            output: gameRoom.output,
          },
          words: gameRoom.game.wordsFound,
          defs: gameRoom.game.defsFound,
          boardId: gameRoom.boardId
        });

        io.to(gameRoom.id).emit("allWordsFound",gameRoom.allWordsFound);
        
      });
    });
  }
}
