import React from "react";
import "./GameBoard.css";
import { useWindowSize } from "./uiHooks.js";
import { BoardDetails } from "./BoardDetails";

export function GameBoard({ props }) {
  const { game, reset, setReset, foundWords, setFoundWords } = props;
  const [boardDims, setBoardDims] = React.useState({});

  const boardRef = React.useRef();
  const windowSize = useWindowSize();

  const { M, N } = game.rank;
  const cubeRefs = React.useRef(Array(M).fill(Array(N).fill(null)));
  const [hidden, setHidden] = React.useState(true);
  const [wordOutput,setWordOutput] = React.useState([]);

  React.useEffect(() => {
    //const currentBoardDims = boardRef.current.getBoundingClientRect();
    const aspectRatio = windowSize.width / windowSize.height;
    const sizeFac = 1.3;
    let [newWidth, newHeight] = [
      windowSize.width / sizeFac / aspectRatio,
      windowSize.height / sizeFac,
    ];
    if (newWidth > 0.99 * windowSize.width) {
      newWidth = 0.98 * windowSize.width;
      newHeight = newWidth;
    }
    //detect mobile and landscape mode
    setBoardDims({ width: newWidth, height: newHeight });
  }, [windowSize]);

  React.useEffect(() => {

    const newWordOutput = [];
    const words = Object.keys(foundWords); //.reverse();
    const mostRecent = words[words.length-1];

    for (const word of words.sort()) {
      newWordOutput.push(
        <div style={{fontSize:"2em"}}>{word}</div>
      )
    }

    setWordOutput(newWordOutput);

  }, [foundWords]);

  let props2 = {
    game,
    boardRef,
    boardDims,
    cubeRefs,
    reset,
    setReset,
    foundWords,
    setFoundWords,
  };
  return (
    !isNaN(boardDims.width) && [
      <div
        ref={boardRef}
        style={{ width: boardDims.width, height: boardDims.height }}
        key="g01"
        className="GameBoard"
      >
        <BoardDetails props={props2} />
      </div>,
      <div
        key="h01"
        hidden={hidden}
        style={{
          opacity: "80%",
          margin: "1vw",
          position: "absolute",
          top: 0,
          zIndex: 20,
          backgroundColor: "yellow",
          width: boardDims.width,
          height: boardDims.height,
        }}
      >
        User Info
      </div>,
      <div
        key="i01"
        className="wordList"
        style={{
          marginLeft: "1vw",
          backgroundColor: "#A0B0FF",
          maxWidth: boardDims.width,
          height: .8*(window.innerHeight-boardDims.height),
          overflow: "auto",
          whiteSpace: "nowrap",
          wordBreak: "break-word",
          borderRadius: "5px",
          overflowY: "scroll"
        }}
      >
        <h3 style={{ margin: "0", marginLeft: "1vw" }}>
          Words Found: {Object.keys(foundWords).length}{" "}
        </h3>
        <div style={{ margin: "1vw" }}>
          {wordOutput}
        </div>
      </div>,
    ]
  );
}

/*
<div style={{ margin: "1vw" }}>
{JSON.stringify(Object.keys(foundWords).reverse())}
</div>
*/