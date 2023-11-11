/*
import React from "react";
import * as THREE from "three";
import  createCubeGroup from "./createCubeGroup"

const GPU = ({props}) => {

  const {
    boardDims,
    game
  } = props;

  const canvasRef = React.useRef();
  const initRef = React.useRef(false);
  const [GL,setGL] = React.useState();
  const frameIdRef = React.useRef();

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

  React.useEffect(() => {
    if (canvasRef.current && !initRef.current) {
      console.log("finally have a canvasRef");
      initRef.current = true;

      const canvas = canvasRef.current;
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });

      renderer.setPixelRatio(1); //need to figure this out, it is ratio of CSS pixel to screen pixel
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor("blue", 1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setPixelRatio(window.devicePixelRatio);

      canvas.appendChild(renderer.domElement);

      const fov = 20;
      const aspect = canvas.clientWidth / canvas.clientHeight; // the canvas default
      const near = 0.1;
      const far = 1000;
      const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      camera.position.set(0, 0, 4.2);
      camera.lookAt(0, 0, 0);

      const scene = new THREE.Scene();
      scene.add(camera);

      const light = new THREE.DirectionalLight( "white", 1)
      light.position.set(-1,0,1)
      scene.add(light)

      const  bogusCube = createCubeGroup(game);

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const phong = new THREE.MeshPhongMaterial({ color: "rgb(100,60,250)" });
      const cube = new THREE.Mesh(geometry, phong);

      scene.add(bogusCube);
      
      setGL({ renderer, scene, camera, bogusCube });

    }
  }, [canvasRef, initRef, game]);

  React.useEffect( ()=>{

    const fpsInterval = 1000/20;
    let frameCount = 0;

    if (initRef.current && GL) {
      const { renderer, scene, camera, bogusCube } = GL;

      let prevTime = 0;

      requestAnimationFrame(render);

      function render(time) {

        frameIdRef.current = requestAnimationFrame(render)
        const  elapsed = time - prevTime;
        if (elapsed < fpsInterval) return;

        prevTime = time - (elapsed%fpsInterval);

        time *= 1e-3; 
        frameCount ++;

        bogusCube.rotation.x += .01;
        renderer.render(scene, camera);
      }

    }

  },[initRef, GL])

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
*/