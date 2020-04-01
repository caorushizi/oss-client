import React, { useEffect, useState } from "react";
import { remote } from "electron";
import reactDom from "react-dom";
import "normalize.css/normalize.css";

import "./index.scss";

const App = () => {
  const [state, setState] = useState({
    dragging: false,
    pageX: 0,
    pageY: 0
  });

  const onMouseDown = (e: MouseEvent) => {
    setState({
      dragging: true,
      pageX: e.pageX,
      pageY: e.pageY
    });
  };
  const onMouseMove = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (state.dragging) {
      const x = e.screenX - state.pageX;
      const y = e.screenY - state.pageY;
      remote.getCurrentWindow().setPosition(x, y);
    }
  };
  const onMouseUp = () => {
    setState({ ...state, dragging: false });
  };

  useEffect(() => {
    window.addEventListener("mousedown", onMouseDown, false);
    window.addEventListener("mousemove", onMouseMove, false);
    window.addEventListener("mouseup", onMouseUp, false);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  });

  return <div className="wrapper" />;
};

reactDom.render(<App />, document.getElementById("root"));
