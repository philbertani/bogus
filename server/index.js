import express from "express"
const app = express();
import httpServer from "http"
const http = httpServer.Server(app) 
import path from "path"
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);  //have to do this for es modules
import cors from "cors"

//React app has the limitation that it will not look for modules higher than /src 
//we want all of the game logic shared between client and server
import bogusMain from "../client/src/common/bogus.js";

//so we needed to separate out the process where we are loading the dictionary 
//from a file on the filesystem using 'fs' object (which is node only)
import { loadDictionary } from "./loadDictionary.js";
import { ioManager } from "./ioManager.js"
 
async function initialize()  {
  //if we can not load the dictionary we are dead in the water, so key 
  //everything off it
  //loadDictionary.call(bogus, ()=>{
  const dict = await loadDictionary( ()=>{
    console.log("finished loadDictionary");
    //const manualBoard = [['C','O','G','O'],['I','E','I','T'],['N','T','K','R'],['Y','N','O','I']];
    //bogus.debugBoard(manualBoard);
    }
  );
  console.log("after await: ",dict.words.length);

  //add option to spawn child processes on different ports at some point
  await mainLoop(dict);
}

initialize();

async function mainLoop(dict) {

  console.log("in main loop");
  const users = {};
  const socketMap = {}; //map  of socket ids to unique user ids
  const userIdSockets = {}; //list of sockets open by unique user id (should be no more than 2)
  let numUsers = 0;

  app.use(cors());
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });

  //this has both the io and gameRooms which contains the game logic
  const ioM = new ioManager(http, dict);

  const host = process.env.HOST || "112.35.81.115"; //'localhost';
  const port = process.env.PORT || 5000;

  //we need http so express can serve the client side app
  http.listen(port, host, () => {
    //need to define HOST as actual IP address to connect with other computers
    //localhost goes nowhere
    console.log(`Socket.IO server running at http://${host}:${port}/`);
  });
}
