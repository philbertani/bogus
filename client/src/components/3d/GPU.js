import React from "react";
import * as THREE from "three";

const GPU = ({props}) => {

  const {
    boardDims
  } = props;

  const canvasRef = React.useRef();
  const initRef = React.useRef(false);
  const [GL,setGL] = React.useState();

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
  }, [GL, boardDims]);

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
    
      <div
        style={{
          height: "100%",
          width: "100%",
          //minHeight: "300px",
          //minWidth: "300px",
          //zIndex: "100"
        }}
        key="canvasDiv"
        id="canvas"
        ref={canvasRef}
      ></div>
  );
}

export default GPU