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
    }
  );
  console.log("after await: ",dict.words.length);

  //add option to spawn child processes on different ports at some point
  await mainLoop(dict);
}

initialize();

async function mainLoop(dict) {

  //const manualBoard = [['C','O','G','O'],['I','E','I','T'],['N','T','K','R'],['Y','N','O','I']];
  //const manualBoard = [['I','E','L','S'],['O','O','S','E'],['G','H','C','U'],['Y','N','S','Y']];
  const bg = new bogusMain(dict);
  bg.debugBoard();
  //save a few boards and their words so we can have valid tests

  console.log("in main loop");

  app.use(cors());
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client/build/index.html"));
  });

  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use(express.static(path.join(__dirname, "..", "client/build")));

  //this has both the io and gameRooms which contains the game logic
  const ioM = new ioManager(http, dict);

  //for render we will set HOST to: 0.0.0.0 and PORT to 10000
  const host = process.env.HOST || 'localhost'; //"112.35.81.115"; //'localhost';
  const port = process.env.PORT || 8080;

  //we need http so express can serve the client side app
  http.listen(port, host, () => {
    //need to define HOST as actual IP address to connect with other computers
    //localhost goes nowhere
    console.log(`Socket.IO server running at http://${host}:${port}/`);
  });

}
