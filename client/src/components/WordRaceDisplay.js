import React from "react";


export default function WordRaceDisplay({searchString,wordToFind,score}) {

  const output = [];

  if ( !wordToFind) {return null};

  for (let i=0; i<wordToFind.length; i++) {
    const style={
      color: "inherit",
      backgroundColor: "inherit"
    }
    if ( searchString[i] === wordToFind[i]) {
      style.color = "yellow";
      style.backgroundColor = "red";
      
    }

    output.push(<span key={"find"+i} style={style}>{wordToFind[i]}</span>)
  }
  return <div>{output} {score && " " + score} </div>


}