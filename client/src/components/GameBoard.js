import React from "react";
import "./GameBoard.css";
import { useWindowSize } from "./uiHooks.js";
import { BoardDetails } from "./BoardDetails";
import { bsearch } from "../common/utils.js";

export function GameBoard({ props }) {
  const { game, reset, setReset, foundWords, setFoundWords } = props;
  const [boardDims, setBoardDims] = React.useState({});

  const boardRef = React.useRef();
  const windowSize = useWindowSize();

  const { M, N } = game.rank;
  const cubeRefs = React.useRef(Array(M).fill(Array(N).fill(null)));
  const [hidden, setHidden] = React.useState(true);
  const [wordOutput, setWordOutput] = React.useState([]);

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
    const words = Object.keys(foundWords); //.reverse(); //game.wordsFound
    const mostRecent = words[words.length - 1];

    const sortedWords = words.sort();
    const search = bsearch(sortedWords, mostRecent);

    //console.log("most recent", search);

    if (isNaN(boardDims.height)) return;

    //have the word list scroll to the closest match and center it in the div
    for (const word of sortedWords) {
      let bgColor = "inherit";
      let color = "black";
      let backgroundImage = "";
      if (word.localeCompare(mostRecent) === 0) {
        backgroundImage = "linear-gradient(#FFFF00,#00FFFF)";
        color = "#A000A0";
      }
      newWordOutput.push([
        <div
          key={"key"+word}
          style={{
            margin: ".5vh",
            marginBottom: "0px",
            marginTop: "0px",
            textAlign: "center",
            color: color,
            backgroundImage: backgroundImage,
            backgroundColor: bgColor,
            fontSize: boardDims.height/20,
            height: "fit-content",
            width:"fit-content",
          }}
        >
          {word}
        </div>,
        <p key={"p"+word}
          style={{lineHeight:boardDims.height/20+"px",margin:0,fontSize:boardDims.height/40,height:boardDims.height/20}}>{"\u2727"}</p>
      ]
      );
    }

    setWordOutput(newWordOutput);
  }, [foundWords, boardDims.height, game.words]);

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
      <h3
        key={"header01"}
        style={{ maxWidth: boardDims.width, textAlign: "center", margin: "0" }}
      >
        Words Found: {Object.keys(foundWords).length}{" "}
      </h3>,
      <div
        key="i01"
        className="wordList"
        style={{
          marginLeft: "1vw",
          backgroundColor: "#A0B0FF",
          maxWidth: boardDims.width,
          height: 0.75 * (window.innerHeight - boardDims.height),
          overflow: "auto",
          whiteSpace: "nowrap",
          wordBreak: "break-word",
          borderRadius: "5px",
          overflowY: "scroll",
        }}
      >
        <div key={"wordList"} style={{ display:"flex",flexDirection:"row", flexWrap:"wrap",margin: "1vw" }}>{wordOutput}</div>
      </div>,
    ]
  );
}
