io.on("connection", (socket) => {
  //console.log("connected a user on socket:", socket.id);

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

  socket.on('info', msg=>{
    console.log("touch event",socket.id,msg);
  });

  //not being used right now
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
    console.log(msg);
  });

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
