import React from 'react';

export function ConnectionState({ isConnected }) {
  return <p style={{margin:0}}>State: { '' + isConnected }</p>;
}
