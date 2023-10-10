import React, { useState, useEffect } from 'react';
import { socket } from './socket';
import { ConnectionState } from './components/ConnectionState';
import { MyForm } from './components/MyForm';
import { Events} from './components/Events';
import { GameBoard } from './components/GameBoard';
import bogusMain from './common/bogus.js';
import {cloneArray} from './common/utils.js';
import {v4 as uuidv4} from 'uuid';

import './App.css';

export default function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [fooEvents, setFooEvents] = useState([]);
  const [mainGame, setMainGame] = React.useState(new bogusMain( {words:["none"], definitions:["none"]} ) );
  const [doneOne, setDoneOne] = React.useState(false);
  const [reset, setReset] = React.useState(false);
  const [foundWords, setFoundWords] = React.useState( {} );  //we need to persist this across page refreshes and reconnects
  const [isDuplicateProcess, setIsDuplicateProcess] = React.useState(false);
  const [checkConnection, setCheckConnection] = React.useState(false);

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
      setMainGame( mainGame );
      setDoneOne(true);
 
      setReset(true);
      console.log('setting mainGame');
    }

    function onDupe(msg) {
      console.log('duplicate process');
      setIsDuplicateProcess(true);
      //onDisconnect();
      socket.disconnect();
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat message', onFooEvent);
    socket.on('new board', onNewBoard);
    socket.on('current board', onNewBoard);
    socket.on('duplicate',onDupe);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat message', onFooEvent);
      socket.off('new board', onNewBoard);
      socket.off('current board', onNewBoard);
      socket.off('duplicate', onDupe);
    };
  }, [mainGame, isDuplicateProcess]);

  const props={game:mainGame,reset,setReset,foundWords,setFoundWords};
  return (
    [
      (doneOne && !isDuplicateProcess ) && <GameBoard key="k05" props={props}/> ,
      isDuplicateProcess && <div>You already are Connected</div>,
 
      <div style={{margin:"1vw"}}key="k00" className="App">
        <ConnectionState key="k01" isConnected={ isConnected } />
        <Events key="k02" events={ fooEvents } />
        <MyForm key="k04"/>
      </div>

    ]
  );
}
