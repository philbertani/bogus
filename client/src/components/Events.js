import React from 'react';

export function Events({ events }) {

  if ( !events ) return null;

  return (
    <div style={{maxHeight:"100%", margin:0}}> {
      events.map( (event, index) =>
        <p style={{margin:0}} key={ index }>{ event }</p>
      )
    } </div>
  );
}
