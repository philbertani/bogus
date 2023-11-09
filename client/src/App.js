import React, { useState, useEffect, useDebugValue } from 'react';
import { socket } from './socket';
import { ConnectionState } from './components/ConnectionState';
//import { MyForm } from './components/MyForm';
//import { Events} from './components/Events';
import { GameBoard } from './components/GameBoard';
import bogusMain from './common/bogus.js';
import {cloneArray} from './common/utils.js';
import {v4 as uuidv4} from 'uuid';
import './App.css';

//if we lose connection and reload page, load the previous board from
//localStorage

export default function App() {

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [fooEvents, setFooEvents] = useState([]);
  const [mainGame, setMainGame] = React.useState(new bogusMain( {words:["none"], definitions:["none"]} ) );
  const [doneOne, setDoneOne] = React.useState(false);
  const [reset, setReset] = React.useState(false);
  const [foundWords, setFoundWords] = React.useState( {} );  //we need to persist this across page refreshes and reconnects
  const [isDuplicateProcess, setIsDuplicateProcess] = React.useState(false);
  const [checkConnection, setCheckConnection] = React.useState(false);

  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  const [allWordsFound, setAllWordsFound] = React.useState( {} );

  const [heartbeatTime, setHeartbeatTime] = React.useState(0);
  const [waitingForHeartbeat,setWaitingForHeartbeat] = React.useState(false);

  useEffect(() => {

    if (isConnected && !waitingForHeartbeat) {
      const heartbeatId = uuidv4();
      const time = Date.now();
      socket.emit("heartbeat", {heartbeatId, time });
      setHeartbeatTime(0);
      setWaitingForHeartbeat(true);
    }

    //return () => clearInterval(heartbeat);
  }, [isConnected, waitingForHeartbeat]);

  useEffect( ()=> {
    const hb = setInterval( ()=>{
      setHeartbeatTime(heartbeatTime + 1)
    }, 1000);

    //what to do if heartbeatTime gets too big??
    if (heartbeatTime > 3) console.log(Date.now(),heartbeatTime);

    return ()=> clearInterval(hb);

  }, [heartbeatTime]);

  useEffect ( ()=>{

    if (checkConnection && !isDuplicateProcess ) {
      console.log("trying to reconnect");
      //on disconnect we needed to actually close the socket to force the server to remove it
      //reinitialize the socket connection so it will automatically try to reconnect
      socket.connect();
      setCheckConnection(false);
    }

  } ,[checkConnection, isDuplicateProcess] );

  useEffect(() => {

    function onConnect(msg) {
      setIsConnected(true);

      let userId = localStorage.getItem("bogusId");
      if ( !userId ) {
        const uuid = uuidv4();
        localStorage.setItem("bogusId",uuid);
        userId = uuid;
      } 
      let sessionId = sessionStorage.getItem("bogusId");
      if ( !sessionId ) {
        const uuid = uuidv4();
        sessionStorage.setItem("bogusId",uuid);
        sessionId = uuid;        
      }
      setReset(true);
      socket.emit('current board',{userId,sessionId}); //since we are connected ask for the current board
    }

    function onDisconnect() {
      socket.disconnect();
      setIsConnected(false);

      if ( !isDuplicateProcess) {
        setCheckConnection(true);
      }
    }

    function onFooEvent(value) {
      setFooEvents(previous => [...previous, value]);
    }

    function onNewBoard(msg) {

      //if the boards are the same then do not clear the found words array
      //if ( !mainGame.boardsAreSame(msg.game.board) ) { setFoundWords({});}
      //we need to save found words in local storage or on server

      mainGame.board = cloneArray(msg.game.board);
      mainGame.output = cloneArray(msg.game.output);
      mainGame.words = [...msg.words];
      mainGame.definitions = [...msg.defs];
      mainGame.boardId = msg.boardId;
      mainGame.boardType = msg.boardType;

      //console.log(mainGame.definitions);
      window.bogus = mainGame;  //remove this when we are live on the internet obviously

      localStorage.setItem("bogusMain",JSON.stringify(mainGame));

      setMainGame( mainGame );
      setDoneOne(true);
 
      setReset(true);
      console.log('setting mainGame', mainGame.boardId);

      const td = window.matchMedia("(pointer: coarse)").matches;

      //not working
      //if (td) {  setTimeout(()=>{window.screen.orientation.lock("portrait")},2000); }
      setIsTouchDevice(td);
    
    }

    function onDupe(msg) {
      console.log('duplicate process');
      setIsDuplicateProcess(true);
      socket.disconnect();
    }

    function onAllWordsFound(msg) {
      setAllWordsFound(msg);
    }

    function onHeartBeat(msg) {
      //five seconds is good enough
      setTimeout( ()=>{setWaitingForHeartbeat(false); }, 5000 );
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat message', onFooEvent);
    socket.on('new board', onNewBoard);
    socket.on('current board', onNewBoard);
    socket.on('duplicate',onDupe);
    socket.on('allWordsFound', onAllWordsFound);
    socket.on('heartbeat', onHeartBeat);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat message', onFooEvent);
      socket.off('new board', onNewBoard);
      socket.off('current board', onNewBoard);
      socket.off('duplicate', onDupe);
      socket.off('allWordsFound', onAllWordsFound);
      socket.off('heartbeat', onHeartBeat)
    };
  }, [mainGame, isDuplicateProcess]);

  const props = {
    game: mainGame,
    reset,
    setReset,
    foundWords,
    setFoundWords,
    isTouchDevice,
    socket,
    allWordsFound,
    isConnected
  };

  return (
    [
      (doneOne && !isDuplicateProcess ) && <GameBoard key="k05" props={props}/> ,
      isDuplicateProcess && <div>You already are Connected</div>,
 
      /*
      <div style={{margin:"1vw"}}key="k00" className="App">
        <ConnectionState key="k01" isConnected={ isConnected } />
        <Events key="k02" events={ fooEvents } />
      </div>
      */

    ]
  );
}
