import React, { useState } from 'react';
import { socket } from '../socket';

export function MyForm() {
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
    <form onSubmit={ onSubmit }>
      <input value={form.chat} onChange={ e => setForm({chat:e.target.value } )} />
      <button type="submit" disabled={ isLoading }>Submit</button>
    </form>
  );
}
