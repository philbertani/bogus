import React from "react";
import "./GameBoard.css";
import { useWindowSize, useTouches} from "./uiHooks.js";
import { BoardDetails } from "./BoardDetails";
import { bsearch, vec } from "../common/utils.js";

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
  } = props;

  const [boardDims, setBoardDims] = React.useState({});

  const boardRef = React.useRef();
  const windowSize = useWindowSize();

  const [touches, setTouches] = React.useState({});
  const [touchInfo, setTouchInfo] = React.useState();

  const { M, N } = game.rank;
  const cubeRefs = React.useRef(Array(M).fill(()=>Array(N).fill(null)));
  const [hidden, setHidden] = React.useState(true);
  const [wordOutput, setWordOutput] = React.useState([]);

  const wordRefs = React.useRef(Array(game.words.length).fill(null));
  const [searchString, setSearchString] = React.useState("");
  const [debugString, setDebugString] = React.useState("");
  const [isWord, setIsWord] = React.useState(false);
  const [searchStringBackGround, setSearchStringBackground] = React.useState("");

  const isWordRef = React.useState(false);


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

    if (isNaN(boardDims.height)) return;

    const newWordOutput = [];
    const words = Object.keys(foundWords);   //.reverse(); //game.words
    let mostRecent = words[words.length - 1];  //could be undefined
    
    //i really dislike this kind of redundant crap, allWordsFound is a state so 
    //we have to make a copy
     
    //wierd Object.assign was converting the object into a string
    //const allWords = Object.assign('',allWordsFound);

    const allWords = {};
    for (const [key,val] of Object.entries(allWordsFound)) {
      allWords[key] = val;
    }

    for (let i=0; i<words.length; i++) {
      if (!allWords[words[i]]) {
        allWords[words[i]]=-1;
      }
    }
  
    //console.log('zzz',allWords);

    const sortedWords = Object.keys(allWords).sort();  //keep it in alphabet order 

    //i dont think we need wordRefs
    //if ( mostRecent ) {
    //  const search = bsearch(sortedWords, mostRecent);  //highlight the current word
    //  const index = search[3];
    //}

    //have the word list scroll to the closest match and center it in the div

    //console.log(allWords);
    for (const word of sortedWords) {
      let bgColor = "inherit";
      let color = "black";
      let backgroundImage = "";
      if (foundWords[word]) { //word.localeCompare(mostRecent) === 0) {
        backgroundImage = "linear-gradient(#FFFF00,#00FFFF)";
        color = "#A000A0";
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
            borderRadius: "5px"
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

    setWordOutput(newWordOutput);
  }, [foundWords, boardDims.height, game.words, allWordsFound]);

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
    allWordsFound
  };

  const touch0 = React.useRef({});

  function processTouch(ev) {

    ev.preventDefault();
    const tch = ev.touches[0];
    const [x,y] = [tch.clientX, tch.clientY];
    const objects = document.elementsFromPoint(x,y);
    let letter = "none";
    let boardPos = {};

    //we have to dig through the elements at this point
    //but it works well enough
    for (let i=0; i<objects.length; i++) {
      if ( String(objects[i].id).includes('letter')) {
        letter = String(objects[i].id).replace(/letter/,'');
        boardPos = {x:letter.substring(0,1),y:letter.substring(1,2)};

        const isTouchStart = ev.type==="touchstart";
        if ( !touch0.current.x || isTouchStart) {
          touch0.current.x = x;
          touch0.current.y = y;
        }
        const [dx,dy] = [x-touch0.current.x, y-touch0.current.y];

        const len = vec.length([dx,dy]);

        let dir = [0,0];
        let useDir = false;
        if ( len > 1e-4 ) { 
          dir = vec.normalize([dx, dy]);
          useDir = true;
          
        }
        setTouches( {pos:boardPos, dir, useDir, isTouchStart} );
        break;
      }
    }
    
    touch0.current = {x,y};

  }

  React.useEffect( ()=> {
    //this useEffect gets called too many times with isWord being true
    //isWordRef is the easiest solution, React is annoying
    if (isWordRef.current) {
      console.log("trying to send word to server", isWord, searchString);
      socket.emit('word', searchString);
    }

  },[isWord,searchString,isWordRef,socket]);

  return (
    <div
      onTouchStart={processTouch}
      onTouchMove={processTouch}
      style={{ touchAction: "none" }}
    >
      <div>{JSON.stringify(touchInfo)}</div>
      <div
        key="searchString"
        style={{
          margin: "1vw",
          backgroundImage: searchStringBackGround,
          width: boardDims.width,
          textAlign: "center",
          height: boardDims.height / 10,
          fontSize: boardDims.height / 11,
          lineHeight: boardDims.height / 10 +"px"
        }}
      >
        {searchString}
      </div>
      <div>{debugString}</div>
      <div
        ref={boardRef}
        style={{ width: boardDims.width, height: boardDims.height }}
        key="g01"
        className="GameBoard"
      >
        <BoardDetails props={props2} />
      </div>
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
      </div>

      <h3
        key={"header01"}
        style={{ maxWidth: boardDims.width, textAlign: "center", margin: "0" }}
      >
        You: {Object.keys(foundWords).length}{" "}
        Everyone: {Object.keys(allWordsFound).length}
      </h3>
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
        <div
          key={"wordList"}
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            margin: "1vw",
          }}
        >
          {wordOutput}
        </div>
      </div>
    </div>
  );
}
