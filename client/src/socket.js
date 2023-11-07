import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://112.35.81.115:8080'; //'localhost:5000'

console.log("socket URL is: ", URL);

export const socket = io(URL);