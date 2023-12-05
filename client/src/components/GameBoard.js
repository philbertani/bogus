import React from "react";
import "./GameBoard.css";
import { useWindowSize } from "./uiHooks.js";
import { BoardDetails } from "./BoardDetails";
import { vec, blank2dArray } from "../common/utils.js";

import { UserNameForm } from "./UserNameForm.js";
import { ChatForm} from "./ChatForm.js";
import { Events } from "./Events.js";

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
    foundWordsRef,
    is3d,
    roomInfo,
    currentRoomId,
    setCurrentRoomId,
    setAllWordsFound,
    latestWord,
    playerInfo,
    setGiveUp,
    giveUp,
    chatText,
    chatUsers
  } = props;

  const [boardDims, setBoardDims] = React.useState({});

  const boardRef = React.useRef();
  const windowSize = useWindowSize();

  const [touches, setTouches] = React.useState({});
  const [touchInfo, setTouchInfo] = React.useState(); //for debugging

  const { M, N } = game ? game.rank : {M:5, N:5};
  const cubeRefs = React.useRef(blank2dArray(M,N,null));
  const [wordOutput, setWordOutput] = React.useState([]);

  //const wordRefs = React.useRef(Array(game.words.length).fill(null));
  //const [debugString, setDebugString] = React.useState("");

  const isWordRef = React.useState(false);
  const [searchString, setSearchString] = React.useState("");
  const [isWord, setIsWord] = React.useState(false);
  const [searchStringBackGround, setSearchStringBackground] =
    React.useState({front:"#000000",back:"#FFFFFF"});

  const [wordListPos, setWordListPos] = React.useState({});
  const [displayMenu, setDisplayMenu] = React.useState("none");
  const [displayTimer, setDisplayTimer] = React.useState("none");

  const [displayDefinition, setDisplayDefinition] = React.useState("");
  const [hideDef, setHideDef] = React.useState("none");

  const [count, setCount] = React.useState(0);
  const [totalScore, setTotalScore] = React.useState(0);

  const [cubeStyles, setCubeStyles] = React.useState(blank2dArray(M, N, null));
  const [unsentWords, setUnsentWords] = React.useState([]);

  const colorSchemeRef = React.useRef(1);

  const [userNamePopUp, setUserNamePopUp] = React.useState(false);
  const [numWords, setNumWords] = React.useState(0);

  const [timedGame, setTimedGame] = React.useState(0)

  //const countx = React.useRef(0);
  //countx.current ++;
  //if ( countx.current%100===0) console.log('GameBoard count',countx.current);

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

    //setTouchInfo(["touchdevice:",isTouchDevice])
    if (isNaN(boardDims.height)) return;

    if (!foundWordsRef.current) return;

    //when disconnected new words found are not getting displayed
    //setTouchInfo(foundWordsRef.current);

    const wordsRef = foundWordsRef.current.words;

    //console.log("wordsRef", wordsRef);

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

    const wordsToUse = giveUp ? game.words : sortedWords;
    //const wordsToDisplay = searchString!=='' ? sortedWords.filter(word=>word.startsWith(searchString)) : sortedWords;

    const wordsToDisplay = searchString!=='' ? wordsToUse.filter(word=>word.startsWith(searchString)) : wordsToUse;

    setNumWords(wordsToDisplay.length);
    //have the word list scroll to the closest match and center it in the div

    //at the end of the game we can run through game.words to show all words
    for (const word of wordsToDisplay) {// game.words){ //sortedWords) {
      
      let bgColor = "inherit";
      let color = "black";
      let backgroundImage = "";
      if (wordsRef[word] !== undefined) {
        //word.localeCompare(mostRecent) === 0) {
        backgroundImage = "radial-gradient(#FFFF00,#00FFFF)"; //"linear-gradient(#FFFF00,#00FFFF)";
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
            margin: 0, // ".5vh",
            marginBottom: "0px",
            marginTop: "0px",
            textAlign: "center",
            color: color,
            backgroundImage: backgroundImage,
            backgroundColor: bgColor,
            fontSize: isTouchDevice ? Math.min(window.screen.width,window.screen.height)/22 : boardDims.height/20, 
            height: "fit-content",
            width: "fit-content",
            borderRadius: "5px",
            overflow: isTouchDevice ? "scroll" : "hidden", //weirdness here
            //touchAction: "none"  //annoying, if set then nothing scrolls
          }}
          onClick={ ev => {
            ev.preventDefault();
            if ( !isTouchDevice || isTouchDevice) {
              setCount(0);
              setHideDef("block");
              setDisplayDefinition(definition);
            }
          }}

          //old iphones do not associate touchstart with click

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

  }, [ foundWordsRef.current.words, allWordsFound, isConnected , searchString, giveUp ] ); 
    //one of these is now causing rendering to blow up to 100k
    //reset, foundWordsRef, boardDims.height, isWordRef,
    //game.words, allWordsFound, game, isTouchDevice, isConnected]);

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
    foundWordsRef,
    cubeStyles,
    setCubeStyles,
    socket,
    setAllWordsFound,
    colorSchemeRef,
    setUserNamePopUp,
    setGiveUp
  };

  const touch0 = React.useRef({});

  function processTouch(ev) {

    ev.preventDefault();

    //we need to prevent touch processing when the menu is overlaid
    if (displayMenu === "block") return;

    const tch = ev.touches[0];

    const [x,y] = [tch.clientX, tch.clientY];

    //setTouchInfo(['xxx', x, y, window.screen.width, window.devicePixelRatio]);

    let objects=[];

    let allD = [];
    //const {M,N} = game.rank;

    for (let i=0; i<M; i++) {
      for (let j=0; j<N; j++) {
        const cube = cubeRefs.current[i][j];

        //getBoundindClient gives us the exact same coordinate system 
        //as the touches[0].clientX and Y!!

        const rect = cube.getBoundingClientRect();

        allD.push( {id:cube.id,rect});

        if ( x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
          objects.push({id:cube.id});
          break;
        }

      }
    }

    /*
    try {
      //ios was crashing on this:
      objects = document.elementsFromPoint(x, y ) ?? [];
    }
    catch (err) {
      socket.emit('info',{msg:JSON.stringify(err)});
    }
    */

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
        break;
      }
    }

    touch0.current = { x, y };
  }

  React.useEffect(() => {
    //this useEffect gets called too many times with isWord being true
    //isWordRef is the easiest solution, React is annoying

    if ( giveUp ) {
      //console.log('gave up the game, not sending word');
      return;
    }

    //why is this being rendered so often???
    //console.log('rendering');

    if (isWordRef.current) {

      //setTouchInfo(foundWordsRef.current.words);

      if (isConnected ) {

        //allWords is not being sent from server when this user
        //reconnects, only when they find a new word, annoying
        //const wordsToSend = [...unsentWords,searchString];

        const words = Object.keys(foundWordsRef.current.words);
        //console.log("trying to send words to server", isWord, wordsToSend);
        
        socket.emit("word", {
          words: words, //wordsToSend, //searchString,
          count: words.length,
          totalScore: foundWordsRef.current.totalScore,
        });
      }
      else {
        //not being used but keep here for now
        setUnsentWords(prev=>[...prev,searchString]);
      }
    }
  }, [isWord, searchString, isWordRef, 
    foundWordsRef, isConnected, unsentWords, giveUp]);  //minLetters?

  React.useEffect( ()=>{
    //the server needs to know or else she can cheat
    //console.log('give up status',giveUp);
    if (giveUp) {
      socket.emit('giveUp');
    }
  },[giveUp, socket])

  React.useEffect(() => {
    if (!boardDims.width) return;

    const windowHeight = isTouchDevice ? window.screen.height : window.innerHeight;

    //console.log(Date.now(),boardDims);
    if ( isTouchDevice && windowSize.width > 1.4 * windowSize.height) {
  
      setWordListPos({
        top: boardDims.height / 5,
        left: 1.1 * boardDims.width,
        height: windowHeight - boardDims.height/1.3 ,
      });  
    } 
    else if ( !isTouchDevice && window.innerWidth > 1.5*window.innerHeight ) {
      setWordListPos({
        top: boardDims.height / 8,
        left: 1.1 * boardDims.width,
        height: Math.max(boardDims.height, windowHeight - boardDims.height/2 ),
      });  
    }
    else {
      setWordListPos({
        top: 1.2 * boardDims.height + 0.02 * windowHeight,
        left: 0,
        height: 0.4 * (windowHeight - boardDims.height),
      });
    }
  }, [windowSize, boardDims, isTouchDevice]);

  function generateNewBoard(ev) {
    ev.preventDefault();
    console.log("trying to get new board");
    socket.emit("new board");
  }


  function setGameRoom(room) {

    if ( !isConnected) {
      alert('you are not connected, try again later');
      return;
    }
    
    const roomId = room.displayId;
    //roomId here is an index starting at 0 that just counts the game rooms
    setCurrentRoomId(roomId);
    localStorage.setItem('bogusRoomId',roomId);
    localStorage.setItem('bogusRoomName',room.name);
    
    console.log('setting Game Room',roomId);
    socket.emit('setGameRoom',roomId);
  }
  
  function firstElement(str) {
    const splitStr = str.split(' ');
    return splitStr[0];
  }
  //coming through as null sometimes but apparently the css can deal with it
  //console.log(searchStringBackGround);

  //"\u2b24" is a big circle
  //"\u2261" is the 3 line menu
  const sp = "\u00a0";
  //const spx = sp + sp + sp + sp + sp;

  return (
    boardDims.height &&
    wordListPos.top && [
      <div
        key="gameBoard"
        style={{
          touchAction: "none",
          position: "absolute",
          overFlow: "hidden",
        }}
      >
        <div key="debug" style={{ position: "absolute" }}>
          {JSON.stringify(touchInfo)}
        </div>
        <div
          key="searchString"
          style={{
            position: "absolute",
            marginLeft: 0,
            backgroundImage: searchStringBackGround.back,
            width: boardDims.width,
            textAlign: "center",
            height: boardDims.height / 11,
            fontSize: boardDims.height / 12,
            lineHeight: boardDims.height / 11 + "px",
            zIndex: "-10", //so it slides under the menu icon
            border: "groove",
            borderWidth: boardDims.width * 0.01,
            borderColor: "orange",
            color: searchStringBackGround.front,
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
            height: 1.08 * boardDims.height,
            width: 1.05 * boardDims.width,
            top: 0, //boardDims.height / 8.5,
          }}
          onClick={(ev) => {
            setDisplayMenu("none");
          }}
          onTouchStart={(ev) => {
            setDisplayMenu("none");
          }}
        >
          <p
            style={{
              fontSize: boardDims.height / 15,
              textAlign: "center",
              margin: "0",
            }}
          >
            There are {game.words.length} words!
          </p>

          <div
            key="buttonContainer"
            style={{
              height: boardDims.height / 5,
              width: boardDims.width,
              margin: "0",
            }}
          >
            <div
              key="reset"
              style={{
                position: "absolute",
                left: "50%",
                textAlign: "center",
                margin: "0",
              }}
            >
              <button
                style={{
                  height: boardDims.height / 8,
                  backgroundColor: "red",
                  color: "yellow",
                  fontWeight: "bold",
                  fontSize: boardDims.height / 20,
                }}
                onClick={(ev) => {
                  generateNewBoard(ev);
                }}
                onTouchStart={(ev) => {
                  generateNewBoard(ev);
                }}
              >
                GENERATE<br></br> NEW BOARD
              </button>
              <div
                key="message01"
                style={{
                  fontSize: Math.min(boardDims.height, boardDims.width) / 20,
                }}
              >
                {" "}
                RESETS EVERYONE!!
              </div>
            </div>

            <div
              key="setUserId"
              style={{
                position: "absolute",
                left: "10%",
                textAlign: "center",
                margin: "0",
              }}
            >
              <button
                style={{
                  height: boardDims.height / 8,
                  backgroundColor: "red",
                  color: "yellow",
                  fontWeight: "bold",
                  fontSize: boardDims.height / 20,
                }}
                onClick={(ev) => {
                  setUserNamePopUp(true);
                }}
                onTouchStart={(ev) => {
                  setUserNamePopUp(true);
                }}
              >
                SET<br></br> USERNAME
              </button>

              <div
                key="message02"
                style={{
                  fontSize: Math.min(boardDims.height, boardDims.width) / 20,
                }}
              >
                (If You Wish)
              </div>
            </div>
          </div>

          <div
            key="gameRooms"
            style={{
              width: boardDims.width,
              textAlign: "center",
              fontSize: boardDims.height / 17,
              marginLeft: boardDims.width * 0.005,
            }}
          >
            Choose a Game Room
            {roomInfo.length > 0 &&
              roomInfo.map((room) => (
                <div
                  key={"room" + room.displayId}
                  style={{
                    width: boardDims.width,
                    height: boardDims.height / 14,
                    fontSize: boardDims.height / 15,
                    border: "2px",
                    borderStyle: "solid",
                    //once again numbers are text sometimes and not others so use weak ==
                    background:
                      room.displayId == currentRoomId ? "yellow" : "inherit",
                    lineHeight: boardDims.height / 14 + "px",
                  }}
                  onTouchStart={(ev) => {
                    setGameRoom(room);
                  }}
                  onClick={(ev) => {
                    setGameRoom(room);
                  }}
                >
                  {room.name}
                </div>
              ))}
          </div>

          <br></br>
          <div style={{ position: "absolute", left: boardDims.width / 2.8 }}>
            <button
              style={{
                height: boardDims.height / 8,
                backgroundColor: "red",
                color: "yellow",
                fontWeight: "bold",
                fontSize: boardDims.height / 20,
              }}
              onClick={(ev) => {
                setGiveUp(true);
                setReset(true);
              }}
              onTouchStart={(ev) => {
                setGiveUp(true);
                setReset(true);
              }}
            >
              GIVE UP<br></br>SEE WORDS
            </button>
          </div>
        </div>

        <div
          key="timer"
          style={{
            display: displayTimer,
            backgroundColor: "rgba(255,255,255,.9)",
            position: "absolute",
            zIndex: "100",
            height: 1.08 * boardDims.height,
            width: 1.05 * boardDims.width,
            top: 0, //boardDims.height / 8.5,
          }}
          onClick={(ev) => {
            setDisplayTimer("none");
          }}
          onTouchStart={(ev) => {
            setDisplayTimer("none");
          }}
        >
          <button
            style={{
              position:"absolute",
              left:"50%",
              top:"10%",
              transform:"translate(-55%,0)",
              height: boardDims.height / 8,
              backgroundColor: "red",
              color: "yellow",
              fontWeight: "bold",
              fontSize: boardDims.height / 20,
            }}
            onClick={(ev) => {
              setTimedGame(true);
            }}
            onTouchStart={(ev) => {
              setTimedGame(true);
            }}
          >
            Start TIMED Game
          </button>
          <p style={{position:"absolute",width:boardDims.width,textAlign:"center"}}>Default Game Time is 5 Minutes</p>
        </div>

        <div
          key="g01"
          onTouchStart={processTouch}
          onTouchMove={processTouch}
          ref={boardRef}
          style={{
            marginLeft: 0, //boardDims.width * 0.01,
            width: boardDims.width,
            height: boardDims.height,
            position: "absolute",
            top: boardDims.height / 8,
            left: -boardDims.width * 0.02,
          }}
          className="GameBoard"
        >
          {!is3d ? (
            <BoardDetails key="boardDetails" props={props2} />
          ) : (
            <div>no 3d sorry</div>
          )}
        </div>

        {/* !is3d ? <BoardDetails props={props2} /> : <GPU props={props2} /> */}

        <div
          style={{
            position: "absolute",
            width: boardDims.width * 0.55,
            top: boardDims.height * 1.03,
            backgroundColor: "lavender",
            overflow: "hidden",
            overflowX: "scroll",
            overflowY: "scroll",
            zIndex: 20,
            left: boardDims.width * 0.46,
            height: boardDims.height * 0.09,
            whiteSpace: "nowrap",
            fontSize: boardDims.height * 0.04,
            fontFamily: "Courier, monospace",
            color: "black",
            fontWeight: "bold",
          }}
        >
          {chatText.join("-")} <br></br>
          {chatUsers.join("-")}
        </div>

        <div
          style={{
            position: "absolute",
            left: boardDims.width * 0.01,
            top: boardDims.height * 1.025,
            width: boardDims.width,
            height: boardDims.height * 0.09,
            backgroundColor: "white",
            zIndex: 10,
            fontSize: boardDims.height * 0.045,
            lineHeight: boardDims.height * 0.045 + "px",
          }}
        >
          <div style={{ position: "absolute", top: "0%" }}>
            <span>Latest:</span>
            {latestWord}
          </div>

          <div style={{ position: "absolute", top: "53%" }}>
            Game Total:{Object.keys(allWordsFound).length}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: wordListPos.left,
            top: wordListPos.top - boardDims.height * 0.115,
            width: boardDims.width,
            height: boardDims.height * 0.09,
            backgroundColor: "white",
            border: "5px groove orange",
            borderWidth: boardDims.width * 0.01,
            zIndex: 10,
          }}
        >
          <div
            key="menu"
            style={{
              margin: "0",
              position: "absolute",
              top: -boardDims.height * 0.015, //0, //"-2vh",
              left: boardDims.width * 0.02,
              fontSize: boardDims.height / 12,
              //backgroundColor: "rgba(250,250,100,.5)",
              width: boardDims.width * 0.05,
              height: boardDims.height * 0.06,
              color: "rgba(0,50,150,1)",
              lineHeight: boardDims.height / 9 + "px",
              zIndex: 100,
            }}
            onTouchStart={(ev) => {
              if (isTouchDevice) {
                displayMenu === "none"
                  ? setDisplayMenu("block")
                  : setDisplayMenu("none");
              }
            }}
            onClick={(ev) => {
              if (!isTouchDevice) {
                displayMenu === "none"
                  ? setDisplayMenu("block")
                  : setDisplayMenu("none");
              }
            }}
          >
            {"\u22ee"}
          </div>

          <div
            key="timerMenu"
            style={{
              margin: "0",
              position: "absolute",
              top: -boardDims.height * 0.01,
              left: boardDims.width * 0.1,
              fontSize: boardDims.height / 15,
              //backgroundColor: "rgba(250,250,100,.5)",
              width: boardDims.width * 0.05,
              height: boardDims.height * 0.06,
              color: "rgba(0,50,150,1)",
              lineHeight: boardDims.height / 9 + "px",
              zIndex: 100,
            }}
            onTouchStart={(ev) => {
              if (isTouchDevice) {
                displayTimer === "none"
                  ? setDisplayTimer("block")
                  : setDisplayTimer("none");
              }
            }}
            onClick={(ev) => {
              if (!isTouchDevice) {
                displayTimer === "none"
                  ? setDisplayTimer("block")
                  : setDisplayTimer("none");
              }
            }}
          >
            {"\u231b"} {/*hourglass symbol */}
          </div>

          <div
            key="colorScheme"
            style={{
              position: "absolute",
              left: boardDims.width * 0.23,
              top: 0, //-boardDims.height*.002, // 0, //"-2vh",
              width: boardDims.width * 0.09,
              height: boardDims.height * 0.09,
              lineHeight: boardDims.height / 9 + "px",
              //backgroundColor: "rgba(250,250,100,.5)",
            }}
            onClick={(ev) => {
              console.log("changing color scheme", colorSchemeRef.current);
              colorSchemeRef.current = (colorSchemeRef.current + 1) % 2;
            }}
          >
            <img
              style={{
                position: "absolute",
                top: "15%",
                left: "15%",
                height: "70%",
                width: "70%",
              }}
              src="./rotate-colors.png"
              alt="Rotate Colors"
            ></img>
          </div>

          <div
            style={{
              position: "absolute",
              left: "52%",
              top: "15%",
              height: boardDims.height * 0.1,
              width: boardDims.width * 0.5,
            }}
          >
            <ChatForm />
          </div>
        </div>

        <div
          key="definitions"
          style={{
            zIndex: "1000",
            position: "absolute",
            marginLeft: boardDims.width * 0.01,
            left: wordListPos.left,
            top: wordListPos.top + wordListPos.height / 3,
            backgroundColor: "black",
            fontSize: 0.07 * boardDims.height,
            overflow: "auto",
            width: boardDims.width,
            display: hideDef,
            color: "white",
            //touchAction: "none"
          }}
          onClick={(ev) => {
            ev.preventDefault();
            setCount(0);
          }}
        >
          <p style={{ marginTop: "0", marginLeft: boardDims.width * 0.01 }}>
            {displayDefinition}
          </p>
        </div>

        <div
          style={{
            position: "absolute",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: boardDims.height / 17,
            top: wordListPos.top,
            left: wordListPos.left,
            width: boardDims.width / 2,
            zIndex: 100,
            backgroundColor: "lightgray",
            marginLeft: boardDims.width * 0.01,
          }}
        >
          {roomInfo.length > 0 && firstElement(roomInfo[currentRoomId].name)}
          <span style={{ fontSize: boardDims.height / 30 }}>
            {sp} ({numWords})/{game.words.length}
          </span>
        </div>

        <div
          key="wordListContainer"
          className="wordList"
          style={{
            //touchAction: "none",
            marginLeft: boardDims.width * 0.01,
            backgroundColor: "#A0B0FF",
            maxWidth: boardDims.width / 2,
            minWidth: boardDims.width / 2,
            height: wordListPos.height - boardDims.height / 15,
            overflow: "auto",
            whiteSpace: "nowrap",
            wordBreak: "break-word",
            borderRadius: "5px",
            overflowY: "scroll",
            position: "absolute",
            top: wordListPos.top + boardDims.height / 15,
            left: wordListPos.left,
          }}
        >
          <div
            key="wordList"
            style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              marginTop: boardDims.width * 0.01,
              marginLeft: boardDims.width * 0.01,
              overflow: "auto", //isTouchDevice ? "scroll" : "hidden",
              touchAction: "none",
              width: boardDims.width / 2,
            }}
          >
            {wordOutput}
          </div>
        </div>

        <div
          key="playerContainer"
          className="playerList"
          style={{
            //touchAction: "none",
            marginLeft: boardDims.width * 0.01,
            backgroundColor: "#A0B0FF",
            maxWidth: boardDims.width / 2.05,
            minWidth: boardDims.width / 2.05,
            height: wordListPos.height - boardDims.height / 21,
            overflow: "hidden",
            whiteSpace: "nowrap",
            wordBreak: "break-word",
            borderRadius: "5px",
            overflowY: "scroll",
            position: "absolute",
            top: wordListPos.top,
            left: wordListPos.left + boardDims.width / 1.95,
          }}
        >
          <div
            key="playerList"
            style={{
              touchAction: "none",
              width: boardDims.width / 2,
              wordWrap: "break-word",
              overFlowBlock: "scroll",
              //overflow: isTouchDevice ? "scroll" : "hidden", //weirdness here
            }}
            //onTouchMove={ev=>{ev.preventDefault()}}
            onTouchStart={(ev) => {
              ev.preventDefault();
            }}
            onClick={(ev) => {
              ev.preventDefault();
            }}
          >
            <table
              style={{
                display: "block",
                overflow: "auto",
                fontSize: boardDims.width / 27,
                marginLeft: 0,
                zIndex: 10,
                backgroundColor: "lightgrey",
                position: "absolute",
                width: "100%",
                //overflow: isTouchDevice ? "scroll" : "hidden", //weirdness here
              }}
            >
              <tbody>{playerInfo}</tbody>
            </table>
          </div>
        </div>

        <div
          key="info"
          style={{
            zIndex: 20,
            wordBreak: "break-all",
            whiteSpace: "normal",
            position: "absolute",
            top: wordListPos.top + wordListPos.height - boardDims.height / 21,
            left: wordListPos.left + boardDims.width / 1.95,
            width: (boardDims.width / 2) * 0.97,
            fontWeight: "bold",
            backgroundColor: "yellow",
            marginLeft: boardDims.width * 0.01,
          }}
        >
          <p
            style={{
              fontSize: boardDims.width / 24,
              margin: 0,
              marginLeft: boardDims.width * 0.015,
            }}
          >
            Set UserName in Menu
          </p>
        </div>
      </div>,

      /*
      <div
        key="stats"
        style={{
          position: "absolute",
          zIndex: "500",
          top:
            1.5 * window.innerHeight > window.innerWidth
              ? boardDims.height + wordListPos.height + boardDims.height / 4.1
              : boardDims.height + boardDims.height / 5,
          backgroundColor: "rgba(200,100,0,.9)",
          color: "rgba(250,250,0,1)",
          textAlign: "Center",
          marginLeft: boardDims.width * 0.01,
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
      */

      userNamePopUp && (
        <div
          key="userNamePopUp"
          style={{
            position: "absolute",
            width: boardDims.width * 0.99,
            height: boardDims.height / 8,
            backgroundColor: "white",
            borderStyle: "groove",
            borderWidth: boardDims.width * 0.02,
            top: boardDims.height / 8,
            zIndex: 10000,
          }}
        >
          <UserNameForm
            setUserNamePopUp={setUserNamePopUp}
            boardDims={boardDims}
          />
        </div>
      ),
    ]
  );


}
