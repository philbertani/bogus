import React from "react";
import { useMouseButton } from "./uiHooks";

//this file is starting to look real ugly

function blank2dArray(M, N, stuffing = 0) {
  return new Array(N).fill(stuffing).map(() => new Array(M).fill(stuffing));
  //do NOT use: Array(N).fill(Array(M).fill(0));
  //that wouldcreate the same reference for the same column on every row
}

export function BoardDetails({ props }) {
  const { game, boardDims, cubeRefs, reset, setReset, foundWords, setFoundWords } = props;
  const [output, setOutput] = React.useState([]);
  const counter = React.useRef(0);
  const { M, N } = game.rank;
  const mouseButtonDown = useMouseButton();

  //have to move all this sh.t up the flagpole, useState is such a waste of time
  const [cubeStyles, setCubeStyles] = React.useState(blank2dArray(N, M, null));
  const [selected, setSelected] = React.useState([]);
  const [allSelected, setAllSelected] = React.useState(blank2dArray(N, M));
  const [searchString, setSearchString] = React.useState("");

  const lineHeight = React.useRef(0);
  const fontSize = React.useRef(0);
  const selectedRef = React.useRef([]);
  const pathRef = React.useRef([]);

  //console.log(game.words);

  React.useEffect(()=>{
    //we do not need to access any of these from higher up, but we do 
    //need to know when to reset from above
    if ( reset ) {
      console.log("resetting arrays");
      setCubeStyles(blank2dArray(N, M, null));
      setSelected([]);
      setAllSelected(blank2dArray(N, M));
      setSearchString("");
      setReset(false);
      selectedRef.current = [];
    }
  },[reset, setReset, M, N]);

  React.useEffect(() => {
    counter.current++;
    let tmpStyles = [];
    let top = 3;
    const marginFac = 0.95;
    for (let j = 0; j < N; j++) {
      let left = 3;
      let row = [];
      for (let i = 0; i < M; i++) {
        let boxStyle = {
          color: "#FFFFFF",
          position: "absolute",
          boxSizing: "borderBox",
          borderRadius: "10px",
          fontWeight: "700",
          fontFamily: "Times New Roman, Times, serif",
          backgroundImage: "radial-gradient(#400040,#A000F0)",
          userSelect: "none",
          top:top,
          left:left,
          height:(marginFac * boardDims.height) / N + "px",
          width:(marginFac * boardDims.width) / M + "px",
          fontSize: (0.6 * boardDims.height) / N + "px"
        }

        if (cubeStyles[j][i]) {
          //if cubeStyles elements have been set already then preserve the 
          //colors which may have changed due to selection or found words
          boxStyle.backgroundImage = cubeStyles[j][i].backgroundImage;
          boxStyle.color = cubeStyles[j][i].color;
        }

        fontSize.current = (0.6 * boardDims.height) / N + "px";
        lineHeight.current = (0.9 * marginFac * boardDims.height) / N;
        left += boardDims.width / M;
        row.push(boxStyle);
      }
      tmpStyles.push(row);
      top += boardDims.height / N;
    }

    if (counter.current % 100 === 0) console.log(counter.current);

    //need to regenerate pathRef to track new letter positions


    //we have to let React manage the styles using useState
    setCubeStyles(tmpStyles);
  }, [M, N, boardDims, cubeRefs, game.board, game.rank]);

  
  function deepClone(B) {
    return JSON.parse(JSON.stringify(B));
  }

  function SN( str ) {
    //parseFloat ?
    return Number(str.replace('px',''));
  }

  function resetPath() {

  }

  function addPathDiv(style,prevStyle,i,j,iOld,jOld) {
    const y = style.top + SN(style.height)/2;
    const x = style.left + SN(style.width)/2;
    const yOld = prevStyle.top + SN(style.height)/2;
    const xOld = prevStyle.left + SN(style.width)/2;

    let transformText = "rotate(0deg)";

    const left = Math.min(x,xOld);
    let top  = Math.min(y,yOld);

    if (j===jOld) {  //same column so we at 90 degrees
      top += SN(style.height)/2;
      transformText = "translate(-50%,50%) rotate(90deg) ";
    }

    else if ( i !== iOld && j !== jOld ) {
      console.log(i,iOld, j,jOld);
      top += SN(style.height)/2;
      
      if ( i> iOld && j>jOld) {
        transformText = "rotate(45deg) scale(1.4)"; 
      }
      else if (i > iOld && j<jOld) {
        transformText = "rotate(135deg) scale(1.4)";
      }
      else if ( i < iOld && j>jOld) {
        transformText = "rotate(-45deg) scale(1.4)";
      }
      else if ( i < iOld && j<jOld) {
        transformText = "rotate(45deg) scale(1.4)";
      }
    }

    return (
      <div 
        style={{transform:transformText,position:"absolute",top:top,left:left,zIndex:50,
        width:"10vw",height:".5vh",backgroundImage:"linear-gradient(#000000,#FFFF00)",opacity:"80%"}}>
      </div>
    )
   
  }

  React.useEffect(() => {

    function handleClick(ev, i, j) {
      //this state management stuff could be nasty performance wise

      ev.preventDefault();

      let newStyles = deepClone(cubeStyles); //this is ugly
      let newSelected = deepClone(allSelected);

      if (selected.length === 0) {
        newStyles[i][j].backgroundImage = "radial-gradient(#FFFF00,#F000FF)";
        newStyles[i][j].color = "#A000F0";
      } 
      else {

        if (game.isValidMove(i, j, selected) && allSelected[i][j] === 0) {

          const [iOld,jOld] = selected;
          const style = newStyles[i][j];
          const prevStyle = cubeStyles[iOld][jOld];

          style.backgroundImage = "radial-gradient(#FFFF00,#F000FF)";
          style.color = "#A000F0";

          pathRef.current.push(addPathDiv(style,prevStyle,i,j,iOld,jOld));

        } else {
          for (let j = 0; j < N; j++) {
            for (let i = 0; i < M; i++) {
              newStyles[i][j].backgroundImage =
                "radial-gradient(#400040,#A000F0)";
              newStyles[i][j].color = "#FFFFFF";
            }
          }
          newStyles[i][j].backgroundImage = "radial-gradient(#FFFF00,#F000FF)";
          newStyles[i][j].color = "#A000F0";
          newSelected = blank2dArray(M, N);
          setSearchString("");
          selectedRef.current = [];
          pathRef.current = [];
        }

      }

      newSelected[i][j] = 1;
      setSelected([i, j]);
      setAllSelected(newSelected);
      setSearchString((prev) => prev + game.board[i][j]);
      setCubeStyles(newStyles);
      selectedRef.current.push({i,j});
    }

    function handleMouseOver(ev, ix, jx, flag) {
      ev.preventDefault();
      //this state management stuff could be nasty performance wise
      let newStyles = deepClone(cubeStyles); //this is ugly

      //set all other fontSizes back to normal
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < M; i++) {
          newStyles[i][j].fontSize = fontSize.current;
        }
      }

      if (flag)
        newStyles[ix][jx].fontSize = (0.8 * boardDims.height) / N + "px";

      setCubeStyles(newStyles);

      if (mouseButtonDown) {
        //console.log("mouse down yippee", mouseButtonDown);
        //handleClick(ev,ix,jx)
      }
    }

    let tmpOutput = [];
    for (let j = 0; j < M; j++) {
      for (let i = 0; i < N; i++) {

        let letter = game.output[i][j]; //board[i][j];

        const keyVal = i.toString() + j.toString();

        //we need to leave some room for the mouse or finger to squeeze between letters
        //so we can swipe a nice path
        const lh = lineHeight.current * 0.7 + "px";
        tmpOutput.push(
          <div
            ref={(el) => (cubeRefs.current[i][j] = el)}
            onClick={(ev) => handleClick(ev, i, j)}
            style={cubeStyles[i][j]}
            key={"boxNum" + keyVal}
          >
            <div
              style={{
                textAlign: "center",
                lineHeight: lh,
                boxSizing: "border-box",
                position: "absolute",
                top: "15%",
                left: "15%",
                width: "70%",
                height: "70%",
                borderRadius: "10px",
              }}
              onMouseOver={(ev) => handleMouseOver(ev, i, j, true)}
              onMouseOut={(ev) => handleMouseOver(ev, i, j, false)}
            >
              {letter}
            </div>
          </div>
        );
      }
    }

    //console.log("path is", pathRef.current);
    tmpOutput.push(...pathRef.current);

    setOutput(tmpOutput);
  }, [
    M,
    N,
    game,
    cubeRefs,
    cubeStyles,
    boardDims,
    selected,
    allSelected,
    searchString,
  ]);


  React.useEffect(() => {
    const search = game.isWord(searchString, false);

    //console.log(game.output);
    //console.log(searchString, search);

    if (!search[1]) {
      //set colors to Red ish
    } else if (search[1]) {
      //add it to the user's found words
      const newWords = JSON.parse(JSON.stringify(foundWords));
      if (newWords[searchString]) {  
        newWords[searchString]++;
      }
      else {
        newWords[searchString] = 1;
      }

      let newBackgroundImage =  "radial-gradient(#FFFF00,#00FFFF)";
      let newColor =  "#E000E0";
      if (foundWords[searchString]) {
        //if we already found this word color it grey-ish
        newBackgroundImage = "radial-gradient(#FFFFFF,#000000)";
        newColor = "#101010";
      }

      let newStyles = deepClone(cubeStyles); //this is ugly
      for (const Index of selectedRef.current) {
        const {i,j} = Index;
        const style = newStyles[i][j];
        style.backgroundImage = newBackgroundImage;
        style.color = newColor;
      }

      setCubeStyles(newStyles);
      setFoundWords(newWords);
    
    }
  }, [searchString, game, setFoundWords]);
  //React is wrong about adding foundWords here: it cause infinite renders

  return <div>{output}</div>;
}
