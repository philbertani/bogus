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
  roomMap = [];
  numRooms = 0;
  
  BOARDTYPES = {NORMAL:0,TORUS:1};
  boardType;

  constructor(http, dict) {
    try {
      this.io = new Server(http, {
        cors: { origin: "*", methods: ["GET", "POST"] },
      });

      this.setHandlers(this.io);
      const newRoomId = uuidv4();
      this.gameRooms[newRoomId] = new gameRoom(newRoomId, this.io, dict, this.BOARDTYPES.NORMAL) ;
      this.roomMap.push(newRoomId);

      this.numRooms ++;
      const room2 = uuidv4();
      this.gameRooms[room2] = new gameRoom(room2, this.io, dict, this.BOARDTYPES.TORUS);
      this.roomMap.push(room2); 

      //add a gameRoom for testing, so we don't interfere with ongoing games

      this.statsInterval = setInterval( ()=>{
        for (const gameRoom of Object.values(this.gameRooms) ) {
          gameRoom.sendStats();
        }
      }, 1500);

    } catch (error) {
      console.log("aweful happenings in ioManager Constructor", error);
    }
  }

  getGameRoom(socketId) {
    const userId = this.socketMap[socketId];
    if (this.users[userId]) {
      const roomId = this.users[userId].roomId;
      const gameRoom = this.gameRooms[roomId];
      return {gameRoom,userId};
    }
    else {
      return {gameRoom:null, userId:null};
    }
  }

  emitGame(io, gameRoom, socketId) {
    //we may be emitting game whole gameRoom or just one player
    //depending on socketId
    io.to(socketId).emit("current board", {
      game: {
        board: gameRoom.board,
        output: gameRoom.output,
      },
      words: gameRoom.game.wordsFound,
      defs: gameRoom.game.defsFound,
      boardId: gameRoom.boardId,
      boardType: gameRoom.game.boardType,
      bogus3d: process.env.bogusEnv
    });

    console.log('bogusEnv is:',process.env.bogusEnv);

    io.to(gameRoom.id).emit("allWordsFound", gameRoom.allWordsFound);  
  }

  setHandlers(io) {
    
    io.on("connection", (socket) => {
      console.log("connected a user on socket:", socket.id);
    });

    io.on("connection", (socket) => {
      //not being used right now
      socket.on("heartbeat", (msg) => {
        //console.log("heartbeat", msg);
        io.to(socket.id).emit("heartbeat", {
          heartbeatId: msg.heartbeatId,
          receive: msg.time,
          sent: Date.now(),
        });
      });
    });

    io.on("connection", (socket) => {
      //not being used right now
      socket.on("chat message", (msg) => {
        io.emit("chat message", msg);
        console.log(msg);
      });
    });

    io.on("connection", socket=> {
      socket.on("word", msg => {

        const {gameRoom, userId} = this.getGameRoom(socket.id);

        if  ( !gameRoom ) {
          console.log('could not find user based on socket',socket.id);
          return;
        }

        const {word,count,totalScore} = msg;


        console.log(Date.now(),"word found by",socket.id,"in room:",gameRoom.id, word, count, totalScore);
        gameRoom.setPlayerWordCount(userId,count,totalScore);

        if (gameRoom.allWordsFound[word]) { 
          gameRoom.allWordsFound[word] ++ ;
        }
        else {
          gameRoom.allWordsFound[word] = 1;
        }

        //console.log(gameRoom.allWordsFound);
        io.to(gameRoom.id).emit('allWordsFound',gameRoom.allWordsFound);
        
      });
      
    });

    io.on("connection", (socket) => {
      socket.on("new board", (msg) => {
        //const userId = this.socketMap[socket.id];
        //console.log("new board requested by",this.users[userId]);

        const {gameRoom} = this.getGameRoom(socket.id);
        if (!gameRoom) {
          console.log(
            "new board request, could not resolve socket id:",
            socket.id
          );
          return;
        }

        gameRoom.newBoard();
        
        this.emitGame(io,gameRoom, gameRoom.id);

      });
    });

    io.on("connection", (socket) => {
      socket.on("disconnect", (reason) => {
        //on disconnect all we have is the socket id
        console.log("disconnected: ", socket.id);
        const userId = this.socketMap[socket.id];
        if (userId) {
          this.users[userId].sessionId = null;
          const gameRoomId = this.users[userId].roomId;

          if (this.gameRooms[gameRoomId]) {
            this.gameRooms[gameRoomId].removePlayer(userId);
          } 
          else {
            console.log('Weird no gameRoomId for userId', userId);
          }
    

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
          roomId: this.roomMap[1]  
        };

        const roomId = this.users[msg.userId].roomId;
        console.log('roomid',roomId, this.gameRooms[roomId].id);
        const gameRoom = this.gameRooms[roomId];

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
    
        this.emitGame(io,gameRoom,socket.id);

      });

    });

  }

}
