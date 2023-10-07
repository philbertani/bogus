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
import bogusMain from "../client/src/common/bogus.js"

//so we needed to separate out the process where we are loading the dictionary 
//from a file on the filesystem using 'fs' object (which is node only)
import { loadDictionary } from "./loadDictionary.js";

const bogus = new bogusMain( ()=>{console.log("finished")} );
loadDictionary.call(bogus, ()=>{console.log("finished loadDictionary"); bogus.newBoard()});

console.log('loading');
const users = {};

//const io = require('socket.io')(http);
const io = new Server(http,{cors:{origin:"*",methods:["GET","POST"]}});

app.use(cors());
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  //socket.emit("current board", {board:bogus.board, words:bogus.wordsFound});
  console.log('connected a user',socket.id);

});

io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message',  msg);
    console.log(msg);
  });
});

io.on('connection', (socket) => {
  socket.on('new board', msg => {
    io.emit('new board', {game:bogus.newBoard(), words:bogus.wordsFound} );
  });
});

io.on('connection', (socket) => {
  socket.on('current board', msg => {
    console.log('calling for current board', bogus.board.length);
    io.emit('current board', 
      {game: (bogus.board.length!==0)
        ?{board:bogus.board,output:bogus.output}
        :bogus.newBoard(), words:bogus.wordsFound} );

    console.log("user uuid:",msg,Date.now());
    if (users[msg]) {
      console.log(msg,"has connected previously", users[msg]);
    }
    else {
      users[msg] = Date.now();
    }
  });
});

const host = process.env.HOST || '112.35.81.115' //'localhost';
const port = process.env.PORT || 5000;
//we need http so express can serve the client side app
http.listen(port, host, () => {
  //need to define HOST as actual IP address to connect with other computers
  //localhost goes nowhere
  console.log(`Socket.IO server running at http://${host}:${port}/`);
});
