import React from "react";
import "./GameBoard.css";
import { useWindowSize } from "./uiHooks.js";
import { BoardDetails } from "./BoardDetails";
import { vec } from "../common/utils.js";

//import GPU from "../components/3d/GPU.js"

export function GameBoard({ props }) {
  const {
    game,
    reset,
    setReset,
    foundWords,
    setFoundWords,
    isTouchDevice,
    socket,
    allWordsFound,
    isConnected,
    stats,
    foundWordsRef,
    is3d
  } = props;

  const [boardDims, setBoardDims] = React.useState({});

  const boardRef = React.useRef();
  const windowSize = useWindowSize();

  const [touches, setTouches] = React.useState({});
  const [touchInfo, setTouchInfo] = React.useState(); //for debugging

  const { M, N } = game.rank;
  const cubeRefs = React.useRef(Array(M).fill(() => Array(N).fill(null)));
  const [wordOutput, setWordOutput] = React.useState([]);

  //const wordRefs = React.useRef(Array(game.words.length).fill(null));
  //const [debugString, setDebugString] = React.useState("");

  const isWordRef = React.useState(false);
  const [searchString, setSearchString] = React.useState("");
  const [isWord, setIsWord] = React.useState(false);
  const [searchStringBackGround, setSearchStringBackground] =
    React.useState("");

  const [wordListPos, setWordListPos] = React.useState({});
  const [displayMenu, setDisplayMenu] = React.useState("none");
  const [displayDefinition, setDisplayDefinition] = React.useState("");
  const [hideDef, setHideDef] = React.useState("none");

  const [count, setCount] = React.useState(0);
  const [totalScore, setTotalScore] = React.useState(0);

  React.useEffect(() => {
    //Implementing the setInterval method
    const interval = setInterval(() => {
      setCount(count + 1);
    }, 1000);

    if (count === 2) {
      setHideDef("none");
    }
    //Clearing the interval
    return () => clearInterval(interval);
  }, [count]);

  React.useEffect(() => {
    //const currentBoardDims = boardRef.current.getBoundingClientRect();
    const aspectRatio = windowSize.width / windowSize.height;
    const sizeFac = 1.8;

    //setTouchInfo([JSON.stringify(windowSize),window.screen.width,window.screen.height]);
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
    if (isNaN(boardDims.height)) return;

    if (!foundWordsRef.current) return;

    const wordsRef = foundWordsRef.current.words;
    const newWordOutput = [];
    const words = Object.keys(wordsRef);

    const allWords = {};
    for (const [key, val] of Object.entries(allWordsFound)) {
      allWords[key] = val;
    }

    for (let i = 0; i < words.length; i++) {
      if (!allWords[words[i]]) {
        allWords[words[i]] = -1;
      }
    }

    const sortedWords = Object.keys(allWords).sort(); //keep it in alphabet order

    //have the word list scroll to the closest match and center it in the div

    //at the end of the game we can run through game.words to show all words
    for (const word of sortedWords) {
      //game.words
      let bgColor = "inherit";
      let color = "black";
      let backgroundImage = "";
      if (wordsRef[word]) {
        //word.localeCompare(mostRecent) === 0) {
        backgroundImage = "linear-gradient(#FFFF00,#00FFFF)";
        color = "#A000A0";
      }

      let definition = "weird, no definition found";
      const search = game.isWord(word);
      if (search[1]) {
        definition = game.definitions[search[3]];
      }

      newWordOutput.push([
        <div
          //ref={(el) => (wordRefs.current[index] = el)}
          key={"key" + word}
          style={{
            margin: ".5vh",
            marginBottom: "0px",
            marginTop: "0px",
            textAlign: "center",
            color: color,
            backgroundImage: backgroundImage,
            backgroundColor: bgColor,
            fontSize: boardDims.height / 20,
            height: "fit-content",
            width: "fit-content",
            borderRadius: "5px",
            overflow: isTouchDevice ? "scroll" : "hidden", //weirdness here
            //touchAction: "none"
          }}
          onClick={(ev) => {
            ev.preventDefault();
            setCount(0);
            setHideDef("block");
            setDisplayDefinition(definition);
          }}
        >
          {word}
        </div>,
        <p
          key={"p" + word}
          style={{
            lineHeight: boardDims.height / 20 + "px",
            margin: 0,
            fontSize: boardDims.height / 40,
            height: boardDims.height / 20,
          }}
        >
          {"\u2727"}
        </p>,
      ]);
    }

    //console.log('setting wordoutput', reset, foundWordsRef.current);

    setWordOutput(newWordOutput);

  }, [reset, foundWordsRef, boardDims.height, game.words, allWordsFound, game, isTouchDevice]);

  let props2 = {
    game,
    boardRef,
    boardDims,
    cubeRefs,
    reset,
    setReset,
    foundWords,
    setFoundWords,
    isTouchDevice,
    searchString,
    setSearchString,
    touches,
    setTouchInfo,
    setIsWord,
    setSearchStringBackground,
    isWordRef,
    allWordsFound,
    setTotalScore,
    totalScore,
    foundWordsRef
  };

  const touch0 = React.useRef({});

  function processTouch(ev) {

    ev.preventDefault();
    ev.stopPropagation();

    //setTouchInfo('wtf?????');

    //we need to prevent touch processing when the menu is overlaid
    if (displayMenu === "block") return;

    //on iOs devices long press still causes copy/paste dialog to pop up

    const tch = ev.touches[0];
    const [x, y] = [tch.clientX, tch.clientY];
    const objects = document.elementsFromPoint(x, y);
    let letter = "none";
    let boardPos = {};

    //we have to dig through the elements at this point
    //but it works well enough
    for (let i = 0; i < objects.length; i++) {
      if (String(objects[i].id).includes("letter")) {
        letter = String(objects[i].id).replace(/letter/, "");
        boardPos = { x: letter.substring(0, 1), y: letter.substring(1, 2) };

        const isTouchStart = ev.type === "touchstart";
        if (!touch0.current.x || isTouchStart) {
          touch0.current.x = x;
          touch0.current.y = y;
        }
        const [dx, dy] = [x - touch0.current.x, y - touch0.current.y];

        const len = vec.length([dx, dy]);

        let dir = [0, 0];
        let useDir = false;
        if (len > 1e-4) {
          dir = vec.normalize([dx, dy]);
          useDir = true;
        }
        setTouches({ pos: boardPos, dir, useDir, isTouchStart });
        //setTouchInfo( ['xxx',touches]);

        break;
      }
    }

    touch0.current = { x, y };
  }

  React.useEffect(() => {
    //this useEffect gets called too many times with isWord being true
    //isWordRef is the easiest solution, React is annoying
    if (isWordRef.current) {

      const words = Object.keys(foundWordsRef.current.words);
      //console.log("trying to send word to server", isWord, searchString, score);
      socket.emit("word", {
        word: searchString,
        count: words.length,
        totalScore: foundWordsRef.current.totalScore
      });
    }
  }, [isWord, searchString, isWordRef, socket, foundWordsRef, game.minLetters]);

  React.useEffect(() => {
    if (!boardDims.width) return;

    //console.log(Date.now(),boardDims);
    if ( (isTouchDevice && windowSize.width > 1.4 * windowSize.height)
        || (!isTouchDevice && window.innerWidth > window.innerHeight) ) {
      setWordListPos({
        top: boardDims.height / 7,
        left: 1.1 * boardDims.width,
        height: window.innerHeight - boardDims.height / 7,
      });
    } else {
      setWordListPos({
        top: 1.18 * boardDims.height + 0.02 * window.innerHeight,
        left: 0,
        height: 0.62 * (window.innerHeight - boardDims.height),
      });
    }
  }, [windowSize, boardDims, isTouchDevice]);

  function generateNewBoard(ev) {
    ev.preventDefault();
    console.log("trying to get new board");

    socket.emit("new board");
  }

  //"\u2261" is the 3 line menu
  //pad the beginning of searchString with spaces so it does not overwrite menu
  const sp = "\u00a0";
  //const spx = sp + sp + sp + sp + sp;
  return (
    boardDims.height &&
    wordListPos.top && [
      <div
        onTouchStart={processTouch}
        onTouchMove={processTouch}
        style={{ touchAction: "none", position:"absolute"}}
      >
        <div style={{position:"absolute"}}>{JSON.stringify(touchInfo)}</div>
        <div
          key="searchString"
          style={{
            position:"absolute",
            margin: "1vw",
            backgroundImage: searchStringBackGround,
            width: boardDims.width,
            textAlign: "center",
            height: boardDims.height / 10,
            fontSize: boardDims.height / 11,
            lineHeight: boardDims.height / 10 + "px",
            zIndex: "-10", //so it slides under the menu icon
            border: "solid",
          }}
        >
          {searchString}
        </div>

        <div
          key="menu"
          style={{
            display: displayMenu,
            backgroundColor: "rgba(255,255,255,.9)",
            position: "absolute",
            zIndex: "100",
            height: 1.01 * boardDims.height,
            width: 1.05 * boardDims.width,
            top: boardDims.height / 8.5,
          }}
          onClick={(ev) => {
            setDisplayMenu("none");
          }}
        >
          <p
            style={{
              fontSize: boardDims.height / 14,
              textAlign: "center",
              margin: "2vw",
            }}
          >
            There are {game.words.length} words!
          </p>
          <div style={{ textAlign: "center", margin: "2vw" }}>
            <button
              style={{
                height: boardDims.height / 5,
                backgroundColor: "red",
                color: "yellow",
                fontWeight: "bold",
                fontSize: boardDims.height / 12,
              }}
              onClick={(ev) => {
                generateNewBoard(ev);
              }}
            >
              GENERATE<br></br> NEW BOARD
            </button>
            <div> {sp} Warning RESETS EVERYONE!!</div>
          </div>
        </div>

        <div 
          ref={boardRef}
          style={{
            margin: "1vw",
            width: boardDims.width,
            height: boardDims.height,
            position: "absolute",
            top: boardDims.height / 9,
            //zIndex: "1000"
            //touchAction: "none"
          }}
          key="g01"
          className="GameBoard"
        >
          {!is3d ? <BoardDetails props={props2} /> : <div>no 3d sorry</div>}
        </div>  

        <div   //{!is3d ? <BoardDetails props={props2} /> : <GPU props={props2} />}
          key="header01"
          style={{
            width: boardDims.width,
            maxWidth: boardDims.width,
            textAlign: "center",
            margin: "0",
            position: "absolute",
            top: wordListPos.top - boardDims.height / 12,
            left: wordListPos.left,
            fontWeight: "bold",
            fontSize: 0.06 * boardDims.height,
          }}
        >
          <div
            style={{
              margin: "0",
              position: "absolute",
              top: "-2.5vh",
              left: boardDims.width / 18,
              fontSize: boardDims.height / 10,
              backgroundColor: "rgba(250,250,100,.5)",
              width: boardDims.height / 9,
              //borderRadius: "30%",
              color: "rgba(0,50,150,1)",
            }}
            onClick={(ev) => {
              displayMenu === "none"
                ? setDisplayMenu("block")
                : setDisplayMenu("none");
            }}
          >
            {"\u22ee"}
          </div>
          <div>
            You:{" "}
            {foundWordsRef.current
              ? Object.keys(foundWordsRef.current.words).length
              : 0}{" "}
            Everyone: {Object.keys(allWordsFound).length}
          </div>
          <div
            key="junk01"
            style={{
              color: isConnected ? "green" : "red",
              position: "absolute",
              right: boardDims.width / 30,
              top: "-1.5vh",
              backgroundColor: "rgba(250,250,100,.5)",
              width: boardDims.height / 9,
              fontSize: boardDims.height / 12,
              height: boardDims.height / 9,
              lineHeight: boardDims.height / 9 + "px",
            }}
          >
            {"\u2b24"}
          </div>
        </div>

        <div
          key="definitions"
          style={{
            zIndex: 100,
            position: "absolute",
            margin: "1vw",
            left: wordListPos.left,
            top: wordListPos.top + wordListPos.height / 3,
            backgroundColor: "black",
            fontSize: 0.07 * boardDims.height,
            overflow: "auto",
            width: boardDims.width,
            display: hideDef,
            color: "white",
          }}
          onClick={(ev) => {
            setCount(0);
          }}
        >
          <p style={{ marginTop: "0", marginLeft: "2vw", marginRight: "2vw" }}>
            {displayDefinition}
          </p>
        </div>

        <div
          key="i01"
          className="wordList"
          style={{
            touchAction: "none",
            marginLeft: "1vw",
            backgroundColor: "#A0B0FF",
            maxWidth: boardDims.width,
            minWidth: boardDims.width,
            height: wordListPos.height,
            overflow: "auto",
            whiteSpace: "nowrap",
            wordBreak: "break-word",
            borderRadius: "5px",
            overflowY: "scroll",
            position: "absolute",
            top: wordListPos.top,
            left: wordListPos.left,
          }}
        >
          <div
            key="wordList"
            style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              margin: "1vw",
              overflow: "auto", //isTouchDevice ? "scroll" : "hidden",
              touchAction: "none",
            }}
          >
            {wordOutput}
          </div>
        </div>
      </div>,

      <div
        key="stats"
        style={{
          position: "absolute",
          zIndex: "500",
          top: ( window.innerHeight > window.innerWidth ) ?
            boardDims.height + wordListPos.height + boardDims.height/4.8 : 
            boardDims.height + boardDims.height / 5,
          backgroundColor: "rgba(200,100,0,.9)",
          color: "rgba(250,250,0,1)",
          textAlign: "Center",
          margin: "1vw",
          height: "3.5vh",
          fontSize: "2.5vh",
          lineHeight: "3.5vh",
          width: boardDims.width,
        }}
      >
        {stats.playerCount &&
          "Players:" +
            stats.playerCount +
            ", High Score:" +
            stats.maxScore +
            ", Your Score:" +
            //(!is3d && (foundWordsRef.current.totalScore ?? 0))
            (foundWordsRef.current ? foundWordsRef.current.totalScore ?? 0 : 0)}
      </div>,
    ]
  );
}
