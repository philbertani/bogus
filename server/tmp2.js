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
      roomInfo: this.roomInfo
    });
  });
});

io.on("connection", socket => {
  socket.on('info', msg=>{
    console.log("touch event",socket.id,msg);
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

    console.log('words message',msg);
    const {words,count,totalScore} = msg;

    console.log(Date.now(),"words found by",socket.id,"in room:",gameRoom.id, words, count, totalScore);
    gameRoom.setPlayerWordCount(userId,count,totalScore, this.users[userId]);

    let latestWord = "";
    if (words.length > 0) {

      for (const word of words) {
        if (gameRoom.allWordsFound[word]) {
          gameRoom.allWordsFound[word] ++;
        } else {
          gameRoom.allWordsFound[word] = 1;
          latestWord = word;
        }
      }

      //console.log(gameRoom.allWordsFound);
      io.to(gameRoom.id).emit("allWordsFound", 
        {words:gameRoom.allWordsFound,roomId:gameRoom.roomInfo.displayId,latestWord});
    }
    else {
      console.log('weird - words is not ann array or null', words,socket.id);
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

  });

});
