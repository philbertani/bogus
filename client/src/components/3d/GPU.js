import React from "react";
import * as THREE from "three";
import { useWindowSize } from "../uiHooks";

const GPU = props => {

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
  } = props;

  const canvasRef = React.useRef();
  const initRef = React.useRef(false);
  const windowSize = useWindowSize();
  const [GL,setGL] = React.useState();
  const [boardDims,setBoardDims] = React.useState({width:0,height:0});
  const [initBoardSize, setInitBoardSize] = React.useState(false);

  React.useEffect(() => {
  
    setInitBoardSize(true);

    const aspectRatio = windowSize.width / windowSize.height;
    const sizeFac = 1.3;
    let [newWidth, newHeight] = [
      windowSize.width / sizeFac / aspectRatio,
      windowSize.height / sizeFac,
    ];
    if (newWidth > 0.99 * windowSize.width) {
      newWidth = 0.97 * windowSize.width;
      newHeight = newWidth;
    }

    //detect mobile and landscape mode
    setBoardDims({ width: newWidth, height: newHeight });
  }, [windowSize, initBoardSize]);


  React.useEffect(() => {
    if (GL && GL.renderer) {
      const {renderer,camera} = GL;
      if (renderer) {
        renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
        camera.aspect =
          canvasRef.current.clientWidth / canvasRef.current.clientHeight;
        camera.updateProjectionMatrix();
      }
    }
  }, [windowSize, GL, boardDims, initBoardSize]);

  React.useEffect( ()=>{
    if (canvasRef.current && !initRef.current) {
      console.log('finally have a canvasRef');
      initRef.current = true;

      const canvas = canvasRef.current;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha:true });

      renderer.setPixelRatio(1);  //need to figure this out, it is ratio of CSS pixel to screen pixel
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor("blue", 1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      canvas.appendChild(renderer.domElement);

      const fov = 50;
      const aspect = window.innerWidth / window.innerHeight; // the canvas default
      const near = 0.1;
      const far = 1000;
      const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

      const scene = new THREE.Scene();
      scene.add(camera);

      renderer.render(scene, camera);

      setGL({renderer,scene,camera});

    }

  },[canvasRef, initRef])

  return (
    <div style={{ height: "100vh" }} key="GPUContainer" id="GPUContainer">
      <div
        style={{
          margin: boardDims.width * 0.015,
          height: boardDims.height,
          width: boardDims.width,
          minHeight: "300px",
          minWidth: "300px"
        }}
        key="canvasDiv"
        id="canvas"
        ref={canvasRef}
      ></div>
    </div>
  );
}

export default GPU