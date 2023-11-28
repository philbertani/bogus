import React, { useState } from 'react';
import { socket } from '../socket';

export function UserNameForm({setUserNamePopUp, boardDims}) {

  const [form, setForm] = useState({userName: localStorage.getItem("bogusUserName")});
  const [isLoading, setIsLoading] = useState(false);

  function onSubmit(event) {

    event.preventDefault();
    setIsLoading(true);
    
    if ( form.userName.trim() !== '') {
      localStorage.setItem("bogusUserName", form.userName);
    }

    socket.timeout(100).emit('setUserName', form.userName, () => {
      setIsLoading(false);
      setForm({userName:''});
      setUserNamePopUp(false);
    });

  }

  return (
    <form key="formA" onSubmit={ onSubmit }>
      <input style={{height:"86%",position:"absolute",width:boardDims.width*.7,fontSize:boardDims.height/15}} key="inputA" id="inputA" value={form.userName} onInput={ e => setForm({userName:e.target.value } )} />
      <button style={{height:"100%",textAlign:"center",position:"absolute",width:boardDims.width*.2, left:boardDims.width*.79,fontSize:boardDims.height/30}} key="buttonA" type="submit" disabled={ isLoading }>Send UserName</button>
    </form>
  );
}
