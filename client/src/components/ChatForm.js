import React, { useState } from 'react';
import { socket } from '../socket';

export function ChatForm() {
  const [form, setForm] = useState({chat:''});
  const [isLoading, setIsLoading] = useState(false);

  function onSubmit(event) {

    event.preventDefault();
    setIsLoading(true);
        
    socket.timeout(100).emit('chat message', form.chat, () => {
      setIsLoading(false);
      setForm({chat:''});
    });
  }

  return (
    <form key="formA" onSubmit={ onSubmit }>
      <span>
        <input style={{width:"65%",height:"100%"}}key="inputA" id="inputA" value={form.chat} onInput={ e => setForm({chat:e.target.value } )} />
        <button style={{height:"100%"}} key="buttonA" type="submit" disabled={ isLoading }>Chat</button>
      </span>
    </form>
  );
}
