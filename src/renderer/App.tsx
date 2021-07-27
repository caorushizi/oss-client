import React, { FC } from "react";
import "./App.css";
import { Route } from "react-router";
import { BrowserRouter as Router } from "react-router-dom";
import Main from "./nodes/main";

const App: FC = () => {
  return (
    <div className="App">
      <Router>
        <Route path="/" element={<Main />} />
      </Router>
    </div>
  );
};

export default App;
