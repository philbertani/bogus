import React from 'react';
import './GameBoard.css'
import {useWindowSize} from './useWindowSize.js'
import {BoardDetails} from './BoardDetails'

export function GameBoard( {game} ) {
  const [boardDims, setBoardDims] = React.useState({});

  const boardRef = React.useRef();
  const windowSize = useWindowSize();

  const { M, N } = game.rank;
  const cubeRefs = React.useRef(Array(M).fill(Array(N).fill(null)));
  const [foundWords, setFoundWords] = React.useState( {} );

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

  let props = { game, boardRef, boardDims, cubeRefs, foundWords, setFoundWords };
  return (
    !isNaN(boardDims.width) && [
      <div
        ref={boardRef}
        style={{ width: boardDims.width, height: boardDims.height }}
        key="g01"
        className="GameBoard"
      >
        <BoardDetails props={props} />
      </div>,
      <div style={{marginLeft:"1vw",backgroundColor:"grey", maxWidth: boardDims.width,
        overflow:"scroll", wordBreak:"break-word"}} key="foundWords">
        <h3 style={{margin:"0"}}>Words Found: {Object.keys(foundWords).length} </h3>
        {JSON.stringify(foundWords)}</div>
    ]
  );
}