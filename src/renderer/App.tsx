import React from "react";
import "./App.scss";
import aside from "./components/aside";
import main from "./components/main";

function app() {
  return (
    <div className="App">
      <aside />
      <main />
    </div>
  );
}

export default app;
