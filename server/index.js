import express from "express"
const app = express();
import httpServer from "http"
const http = httpServer.Server(app) 
import path from "path"
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);  //have to do this for es modules

import {Server} from "socket.io"
import cors from "cors"

//React app has the limitation that it will not look for modules higher than /src 
//we want all of the game logic shared between client and server
import bogusMain from "../client/src/common/bogus.js";
import {gameRoom} from "./gameRoom.js";

//so we needed to separate out the process where we are loading the dictionary 
//from a file on the filesystem using 'fs' object (which is node only)
import { loadDictionary } from "./loadDictionary.js";


async function initialize()  {
  //loadDictionary.call(bogus, ()=>{
  const dict = await loadDictionary( ()=>{
    console.log("finished loadDictionary");
    //const manualBoard = [['C','O','G','O'],['I','E','I','T'],['N','T','K','R'],['Y','N','O','I']];
    //bogus.debugBoard(manualBoard);
    }
  );
  console.log("after await: ",dict.words.length);

  await mainLoop(dict);
}

initialize();

async function mainLoop(dict) {

  console.log("in main loop");
  const users = {};
  const socketMap = {}; //map  of socket ids to unique user ids
  const userIdSockets = {}; //list of sockets open by unique user id (should be no more than 2)
  let numUsers = 0;

  const io = new Server(http, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });
  const gameRooms = [new gameRoom(io,dict)];

  app.use(cors());
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });

  io.on("connection", (socket) => {
    console.log("connected a user", socket.id);
  });

  io.on("connection", (socket) => {
    socket.on("chat message", (msg) => {
      io.emit("chat message", msg);
      console.log(msg);
    });
  });

  io.on("connection", (socket) => {
    socket.on("new board", (msg) => {
      //io.emit("new board", { game: bogus.newBoard(), words: bogus.wordsFound });
    });
  });


  io.on("connection", (socket) => {

    socket.on("disconnect", (reason) => {
      //on disconnect all we have is the socket id
      console.log("disconnected: ", socket.id);
      const userId = socketMap[socket.id];
      if (userId) {
        users[userId].sessionId = null;
      } else {
        //weird
        console.log("could not find a userId for socket:", socket.id);
        return;
      }

      const userSockets = userIdSockets[userId];
      const newSocketList = [];
      for (const userSocket of userSockets) {
        if (userSocket.id === socket.id) {
          //this is the one to delete
          delete socketMap[socket.id];
        } else {
          newSocketList.push(userSocket);
        }
      }
      userIdSockets[userId] = newSocketList;
    });
  });


  io.on("connection", (socket) => {
    socket.on("current board", (msg) => {

      let seqno;
      const time = Date.now();
      if (users[msg.userId]) {
        console.log(time, msg.userId, "has connected previously");
        seqno = users[msg.userId].seqno;
      } else {
        seqno = numUsers;
        numUsers++;
      }
      users[msg.userId] = {
        sessionId: msg.sessionId,
        connTime: time,
        seqno: seqno,
        socketId: socket.id,
      };

      if (userIdSockets[msg.userId] && userIdSockets[msg.userId].length > 0) {
        console.log(time, "already has an active socket");

        if (socketMap[socket.id]) {
          console.log("already in socket map");
        } else {
          socketMap[socket.id] = msg.userId;
          io.to(socket.id).emit("duplicate");
        }

        userIdSockets[msg.userId].push({ id: socket.id, active: false });
      } else {
        userIdSockets[msg.userId] = [{ id: socket.id, active: true }];
        socketMap[socket.id] = msg.userId;
      }

      //figure out which game room this person belongs to
      io.emit("current board", 
        { game:{board:gameRooms[0].board,
          output:gameRooms[0].output},
          words:gameRooms[0].game.wordsFound} 
      );
    });
  });

  const host = process.env.HOST || "112.35.81.115"; //'localhost';
  const port = process.env.PORT || 5000;

  //we need http so express can serve the client side app
  http.listen(port, host, () => {
    //need to define HOST as actual IP address to connect with other computers
    //localhost goes nowhere
    console.log(`Socket.IO server running at http://${host}:${port}/`);
  });
}
