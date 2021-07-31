import React, { FC } from "react";
import "./App.scss";
import { BrowserRouter, Redirect, Route } from "react-router-dom";
import MainPage from "./nodes/main-page";
import TestPage from "./nodes/test-page";

const App: FC = () => {
  return (
    <div className="App">
      <BrowserRouter>
        <Route path="/main" component={MainPage} />
        <Route path="/test" component={TestPage} />
        <Redirect to="/main/bucket/1" />
      </BrowserRouter>
    </div>
  );
};

export default App;
