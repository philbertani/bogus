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
  
  roomInfo = [];

  BOARDTYPES = {NORMAL:0,TORUS:1};
  VARIATIONS = {WORDFIND:0,WORDRACE:1}

  boardType;

  constructor(http, dict) {
    try {
      this.io = new Server(http, {
        cors: { origin: "*", methods: ["GET", "POST"] },
      });

      this.setHandlers(this.io);

      //dumbass just change the args to an object to avoid much pain
      this.newGameRoom(dict.english,this.BOARDTYPES.TORUS,"five","#1",this.VARIATIONS.WORDFIND);
      this.newGameRoom(dict.english,this.BOARDTYPES.TORUS,"five","#2",this.VARIATIONS.WORDFIND);
      this.newGameRoom(dict.english,this.BOARDTYPES.TORUS,"five","WordRace",this.VARIATIONS.WORDRACE);

      
      this.newGameRoom(dict.english,this.BOARDTYPES.TORUS,"englishEight","WordRace",this.VARIATIONS.WORDRACE);
      this.newGameRoom(dict.hebrew,this.BOARDTYPES.TORUS,"hebrewFive","",this.VARIATIONS.WORDFIND);
      this.newGameRoom(dict.spanish,this.BOARDTYPES.TORUS,"spanishFive","",this.VARIATIONS.WORDFIND);
      this.newGameRoom(dict.spanishLoose,this.BOARDTYPES.TORUS,"spanishFiveLoose","",this.VARIATIONS.WORDFIND);
      this.newGameRoom(dict.italian,this.BOARDTYPES.TORUS,"italianFive","",this.VARIATIONS.WORDFIND);
      this.newGameRoom(dict.english,this.BOARDTYPES.TORUS,"englishSix","",this.VARIATIONS.WORDFIND);
      this.newGameRoom(dict.english,this.BOARDTYPES.TORUS,"four","",this.VARIATIONS.WORDFIND);
      this.newGameRoom(dict.english,this.BOARDTYPES.TORUS,"englishSeven","",this.VARIATIONS.WORDFIND);
      this.newGameRoom(dict.english,this.BOARDTYPES.TORUS,"englishEight","",this.VARIATIONS.WORDFIND);
      
    
      const noLunaBoard = [
        ['O','Ñ','D','S','E'],
        ['U','N','E','I','S'],
        ['R','D','L','L','C'],
        ['O','I','U','N','A'],
        ['N','I','C','N','N'] ];
      //this.newGameRoom(dict.spanishLoose,this.BOARDTYPES.TORUS,"spanishDebug",noLunaBoard);
      
      console.log('game rooms:',this.roomInfo);

      this.statsInterval = setInterval( ()=>{
        for (const gameRoom of Object.values(this.gameRooms) ) {
          gameRoom.sendStats(this.users);
          gameRoom.checkGame(this.users);
        }
      }, 1500);

    } catch (error) {
      console.log("aweful happenings in ioManager Constructor", error);
    }
  }

  newGameRoom(dictionary,boardType,gameType,extraText,variation,debugBoard=[]) {
    const newRoomId = uuidv4();
    this.gameRooms[newRoomId] = new gameRoom(newRoomId, this.io, dictionary, boardType, gameType, extraText, variation, debugBoard);
    this.roomMap.push(newRoomId);
    const roomName = this.gameRooms[newRoomId].data.name + " "  +
      this.gameRooms[newRoomId].game.BOARDTYPE_NAMES[boardType] + " " + extraText; // + boardType;

    console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',roomName);

    const roomInfo = {
      displayId: this.numRooms,
      id: newRoomId,
      name: roomName,
      createTime: Date.now(),
      gameStartTime: 0,
      timedGame: false,
    };

    this.roomInfo.push(roomInfo);
    this.gameRooms[newRoomId].roomInfo = roomInfo;
    this.numRooms ++;   
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

      //this is a half assed way to serialize the game object
      //write a proper function
      words: gameRoom.game.wordsFound,
      defs: gameRoom.game.defsFound,
      paths: gameRoom.game.paths,
      boardId: gameRoom.boardId,
      boardType: gameRoom.game.boardType,
      bogus3d: process.env.bogusEnv,
      rank: gameRoom.game.rank,
      roomId: gameRoom.roomInfo.displayId,
      minLetters: gameRoom.game.minLetters,
      gameType: gameRoom.game.gameType,  //GRID or TORUS
      roomInfo: gameRoom.roomInfo,
      gameVariation: gameRoom.gameVariation, //WORDFIND or WORDRACE
      wordToFind: gameRoom.wordRaceWord,
      wordToFindTime: gameRoom.wordRaceWordTime

    });

    console.log('bogusEnv is:',process.env.bogusEnv);

    io.to(gameRoom.id).emit("allWordsFound", 
      {words:gameRoom.allWordsFound, roomId:gameRoom.roomInfo.displayId});  
  }

  setHandlers(io) {

    io.on("connection", (socket) => {
      socket.on("heartbeat", (msg) => {
        //console.log("heartbeat", msg);

        if (msg.userIsActive) {
          console.log('received user activation message',socket.id);
          const {gameRoom, userId} = this.getGameRoom(socket.id);
    
          if  ( !gameRoom ) {
            console.log('could not find user based on socket',socket.id);
            return;
          }

          gameRoom.setLatestPlayerTime(userId);

          return;
        }

        io.to(socket.id).emit("heartbeat", {
          heartbeatId: msg.heartbeatId,
          receive: msg.time,
          sent: Date.now(),
          roomInfo: this.roomInfo
        });
      });
    });

    /*
    io.on("connection", socket => {
      socket.on('info', msg=>{
        console.log("touch event",socket.id,msg);
      });
    });
    */
        
    io.on("connection", (socket) => {

      socket.on("timedGame", (msg) => {

        const {gameRoom, userId} = this.getGameRoom(socket.id);
    
        if  ( !gameRoom ) {
          console.log('could not find user based on socket',socket.id);
          return;
        }

        console.log('trying to start a timed game in:',gameRoom.roomInfo.name);
        if (msg.message == "requestStart") {
          const message = gameRoom.startTimedGame(msg.length);
          if (message.status == "startGame") {
            gameRoom.newBoard();
            this.emitGame(io,gameRoom, gameRoom.id);  
          }
        }
        else if ( msg.message == "alreadyPlaying") {

        }

      });
    });
    


    io.on("connection", (socket) => {

      socket.on("chat message", (msg) => {

        const {gameRoom, userId} = this.getGameRoom(socket.id);
    
        if  ( !gameRoom ) {
          console.log('could not find user based on socket',socket.id);
          return;
        }

        io.to(gameRoom.id).emit("chat message", {chat:msg, user:this.users[userId].name});
        console.log(msg);

      });
    });
    

    io.on("connection", socket => {
      socket.on('giveUp', msg=>{
        
        const {gameRoom, userId} = this.getGameRoom(socket.id);
    
        if  ( !gameRoom ) {
          console.log('could not find user based on socket',socket.id);
          return;
        }

        gameRoom.giveUp(userId);

      });
    });

    io.on("connection", socket=> {
      socket.on("word", msg => {
    
        const {gameRoom, userId} = this.getGameRoom(socket.id);
    
        if  ( !gameRoom ) {
          console.log('could not find user based on socket',socket.id);
          return;
        }

        gameRoom.setLatestPlayerTime(userId);
    
        console.log(msg);
 
        if ( gameRoom.gaveUp(userId)) {
          console.log('this user gave up the game, not saving word');
          return;
        }

        console.log('words message',msg);
        const {words,count,totalScore} = msg;
    
        console.log(Date.now(),"words found by",socket.id,"in room:",gameRoom.id, words, count, totalScore);
        const playerName = gameRoom.setPlayerWordCount(userId,count,totalScore, this.users[userId]);
    
        let latestWord = "";
        if (words.length > 0) {
    
          for (const word of words) {
            if (gameRoom.allWordsFound[word]) {
              //gameRoom.allWordsFound[word] ++;
            } else {
              gameRoom.allWordsFound[word] = playerName;  //we now know which words were found by which player
              latestWord = word;
            }
          }
    
          if ( msg.wordRace) {
            console.log("found the word race word", msg);
            setTimeout( ()=>{io.to(gameRoom.id).emit("wordRace", gameRoom.newWordRaceWord() );}, 500)
          }
  
          //console.log(gameRoom.allWordsFound);
          io.to(gameRoom.id).emit("allWordsFound", 
            {words:gameRoom.allWordsFound,roomId:gameRoom.roomInfo.displayId,latestWord});
            
        }
        else {
          console.log('weird - words is not an array or null', words,socket.id);
        }
    
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
    
        if (gameRoom.roomInfo.timedGame) {
          io.to(socket.id).emit('timedGame',"Timed Game in progress, you can not reset the board");
          return;
        }
        gameRoom.newBoard();
        
        this.emitGame(io,gameRoom, gameRoom.id);
    
      });
    });
    
    //not working properly, missing something, causing out of bounds and undefined errors 
    io.on("connection", (socket) => {
      socket.on("setGameRoom", (roomId) => {
        //roomId is simply the indes into roomInfo
        const userId = this.socketMap[socket.id];
        if ( !this.users[userId]) {
          console.log('weird no user for socket id',socket.id);
          //need to do something else here
          return;
        }
    
        const user = this.users[userId];
        user.roomId = this.roomInfo[roomId].id;  //switch to the new game room
        const gameRoom = this.gameRooms[user.roomId];
    
        socket.join( gameRoom.id );
        gameRoom.newPlayer(userId, this.users[userId] );
    
        this.emitGame(io, gameRoom, socket.id);
    
        //we need to make sure this particular user gets the updated list from everyone
        io.to(socket.id).emit("allWordsFound", 
          {words:gameRoom.allWordsFound, roomId:gameRoom.roomInfo.displayId});  
    
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
      socket.on("setUserName", (msg) => {
       
        const userId = this.socketMap[socket.id];
        if ( userId) {
          this.users[userId].name = msg;
        }
        else {
          console.log('setUserName: no user for socket, ',socket.id);
        }
    
      } );
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
    
        //currently we are hard coding the choice of game room here:
        this.users[msg.userId] = {
          sessionId: msg.sessionId,
          connTime: time,
          seqno: seqno,
          socketId: socket.id,
          roomId: this.roomMap[0],
          name: msg.userName ?? msg.userId
    
        };
    
        if (msg.roomId) {
          //console.log("debug room",msg);
          //msg.roomId shoudl be the index of the room in this.roomInfo
          //console.log(this.roomInfo);
          const roomId = parseFloat(msg.roomId);
    
          this.users[msg.userId].roomId = this.roomMap[roomId] ?? this.roomMap[0];
    
          //console.log(this.users[msg.userId]);
    
        }
    
        const roomId = this.users[msg.userId].roomId;
    
        //console.log('roomid',roomId, this.gameRooms[roomId].id);
        let gameRoom = this.gameRooms[roomId];
    
        if (
          this.userIdSockets[msg.userId] &&
          this.userIdSockets[msg.userId].length > 0
        ) {
          console.log(time, "already has an active socket");
    
          if (this.socketMap[socket.id]) {
            console.log("already in socket map");
          } else {
            this.socketMap[socket.id] = msg.userId;
            //io.to(socket.id).emit("duplicate");
            //return;
          }
    
          this.userIdSockets[msg.userId].push({ id: socket.id, active: false });
        } else {
          this.userIdSockets[msg.userId] = [{ id: socket.id, active: true }];
          this.socketMap[socket.id] = msg.userId;
          gameRoom.newPlayer(msg.userId, this.users[msg.userId]  );
        }
    
        socket.join( gameRoom.id );
    
        this.emitGame(io,gameRoom,socket.id);
    
        io.to(socket.id).emit("allWordsFound", 
          {words:gameRoom.allWordsFound, roomId:gameRoom.roomInfo.displayId});  

        //io.to(socket.id).emit("wordRace",{wordToFind:gameRoom.wordRaceWord});
    
      });
    
    });
    

 
  }

}
