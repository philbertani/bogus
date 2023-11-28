import { useState, useEffect } from "react";

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.screen.width, //window.innerWidth,
        height: window.screen.height //window.innerHeight,
      });
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
}

//these below are not used - but leaving here for possible future use
export function useMouseButton() {
  const [mouseButtonDown, setMouseButtonDown] = useState(false);
  useEffect(() => {
    window.addEventListener("mouseup", (ev) => {
      ev.preventDefault();
      setMouseButtonDown(false);
    });
    window.addEventListener("mousedown", (ev) => {
      //ev.preventDefault();
      setMouseButtonDown(true);
    });

    return () => {
      window.removeEventListener("mousedown", setMouseButtonDown);
      window.removeEventListener("mouseup", setMouseButtonDown);
    };
  }, []);
  return mouseButtonDown;
}

export function useTouches() {
  const [touches, setTouches] = useState({});

  function handleStart(ev) {
    ev.preventDefault();
    setTouches( [Date.now(),ev.target.id,ev.touches]);
  }
  function handleEnd(ev) {}
  function handleCancel(ev) {}
  function handleMove(ev) {
    ev.preventDefault();
    setTouches([Date.now(), ev.target.id, ev.changedTouches]);  
  }

  useEffect(() => {
    window.addEventListener("touchstart", handleStart, { passive: false });
    window.addEventListener("touchstart", handleEnd, { passive: false });
    window.addEventListener("touchstart", handleCancel, { passive: false });
    window.addEventListener("touchstart", handleMove, { passive: false });

    window.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleCancel);
      window.removeEventListener("touchmove",handleMove);
      window.removeEventListener("contextMenu", null);
    };
  }, []);

  return touches;
}

export function useTouchDown() {
  const [touchDown, setTouchDown] = useState(false);

  useEffect(() => {
    window.addEventListener("touchstart", (ev) => {
      ev.preventDefault();
      setTouchDown(true);
    });
    window.addEventListener("touchend", (ev) => {
      ev.preventDefault();
      setTouchDown(false);
    });

    return () => {
      window.removeEventListener("touchstart", setTouchDown);
      window.removeEventListener("touchend", setTouchDown);
    };
  }, []);

  return touchDown;
}
