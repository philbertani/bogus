import React from 'react';

export function Events({ events }) {
  return (
    <div style={{margin:0}}> {
      events.map( (event, index) =>
        <p style={{margin:0}} key={ index }>{ event }</p>
      )
    } </div>
  );
}
