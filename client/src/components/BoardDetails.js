import React from "react";
//this file is starting to look real ugly

function blank2dArray(M, N, stuffing = 0) {
  return new Array(N).fill(stuffing).map(() => new Array(M).fill(stuffing));
  //do NOT use: Array(N).fill(Array(M).fill(0));
  //that wouldcreate the same reference for the same column on every row
}
export function BoardDetails({ props }) {
  const { game, boardDims, cubeRefs, foundWords, setFoundWords } = props;
  const [output, setOutput] = React.useState([]);
  const counter = React.useRef(0);
  const { M, N } = game.rank;
  const [cubeStyles, setCubeStyles] = React.useState(blank2dArray(N, M, null));
  const [selected, setSelected] = React.useState([]);
  const [allSelected, setAllSelected] = React.useState(blank2dArray(N, M));
  const [searchString, setSearchString] = React.useState("");

  const lineHeight = React.useRef(0);
  const fontSize = React.useRef(0);
  //console.log(game.words);

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
          textAlign: "center",
          color: "#FFFFFF",
          position: "absolute",
        };
        boxStyle.top = top;
        boxStyle.left = left;
        boxStyle.height = (marginFac * boardDims.height) / N + "px";
        lineHeight.current = (0.9 * marginFac * boardDims.height) / N;
        boxStyle.width = (marginFac * boardDims.width) / M + "px";
        boxStyle.boxSizing = "borderBox";
        boxStyle.borderRadius = "10px";
        boxStyle.fontSize = (0.6 * boardDims.height) / N + "px";
        boxStyle.fontWeight = "700";
        fontSize.current = (0.6 * boardDims.height) / N + "px";
        boxStyle.fontFamily = "Times New Roman, Times, serif";
        boxStyle.backgroundImage = "radial-gradient(#400040,#A000F0)";
        boxStyle.userSelect = "none";

        left += boardDims.width / M;
        row.push(boxStyle);
      }
      tmpStyles.push(row);
      top += boardDims.height / N;
    }

    if (counter.current % 100 === 0) console.log(counter.current);

    //we have to let React manage the styles using useState
    setCubeStyles(tmpStyles);
  }, [M, N, boardDims, cubeRefs, game.board, game.rank]);

  React.useEffect(() => {

    function deepClone(B) {
      return JSON.parse(JSON.stringify(B));
    }

    function handleClick(ev, i, j) {
      //this state management stuff could be nasty performance wise

      ev.preventDefault();

      let newStyles = deepClone(cubeStyles); //this is ugly

      let newSelected = deepClone(allSelected);

      if (selected.length === 0) {
        newStyles[i][j].backgroundImage = "radial-gradient(#FFFF00,#F000FF)";
        newStyles[i][j].color = "#A000F0";
      } else {
        if (game.isValidMove(i, j, selected) && allSelected[i][j] === 0) {
          newStyles[i][j].backgroundImage = "radial-gradient(#FFFF00,#F000FF)";
          newStyles[i][j].color = "#A000F0";
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
        }
      }

      newSelected[i][j] = 1;
      setSelected([i, j]);
      setAllSelected(newSelected);

      setSearchString((prev) => prev + game.board[i][j]);

      setCubeStyles(newStyles);
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
    console.log(searchString, search);

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

      setFoundWords(newWords)
    
    }
  }, [searchString, game, setFoundWords]);
  //React is wrong about adding foundWords here: it cause infinite renders

  return <div>{output}</div>;
}
