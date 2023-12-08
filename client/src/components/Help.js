import React from "react";

export function Help({ boardDims }) {
  return (
    <div
      style={{
        position: "absolute",
        width: 1.02 * boardDims.width,
        height: 1.02 * boardDims.height,
        //backgroundColor: "red",
        backgroundImage:"linear-gradient(#0000FF 30%,#F0A000)",
        color: "white",
        zIndex: 2000,
      }}
    >
      <h1 style={{marginLeft:boardDims.width*.02}}>The Lord helps Those who help themselves 😊</h1>
    </div>
  );
}
