import React from "react";
import "./App.scss";
import Aside from "./components/Aside";
import Main from "./components/Main";

function app() {
  return (
    <div className="App">
      <Aside />
      <Main />
    </div>
  );
}

export default app;
