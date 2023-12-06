import React, { useState } from 'react';
import { socket } from '../socket';

export function ChatForm( {boardDims }) {
  //was impossible to size this correctly without boardDims, % is useless
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
    <form key="formA" onSubmit={onSubmit}>
      <span>
        <input
          style={{
            position: "absolute",
            fontSize: boardDims.height * 0.05,
            width: boardDims.width * 0.36,
            height: boardDims.height * 0.07,
          }}
          key="inputA"
          id="inputA"
          value={form.chat}
          onInput={(e) => setForm({ chat: e.target.value })}
        />
        <button
          style={{
            margin: 0,
            position: "absolute",
            left: boardDims.width * 0.39,
            height: boardDims.height * 0.085,
            width: boardDims.width * .085,
            textAlign: "left",
            fontSize: boardDims.height * .05
          }}
          key="buttonA"
          type="submit"
          disabled={isLoading}
        >
          💬
        </button>
      </span>
    </form>
  );
}
