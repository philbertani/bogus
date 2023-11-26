import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV 
  === 'production' 
  ? undefined 
  : 'http://112.35.81.115:8080'; //"127.0.0.1:8080"; //'http://112.35.81.115:8080'; //'localhost:5000'; '192.168.1.173:8080'

console.log("socket URL is: ", URL);
console.log(process.env);

export const socket = io(URL);