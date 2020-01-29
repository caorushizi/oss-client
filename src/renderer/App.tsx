import React from "react";
import "./App.scss";
import { HashRouter as Router, Switch, Route } from "react-router-dom";
import Aside from "./components/Aside";
import Transform from "./components/Transform";
import Setting from "./components/Setting";
import Bucket from "./components/Bucket";

function app() {
  return (
    <div className="App">
      <Router>
        <Aside />
        <Switch>
          <Route exact path="/bucket/:name">
            <Bucket />
          </Route>
          <Route path="/transform">
            <Transform />
          </Route>
          <Route path="/setting">
            <Setting />
          </Route>
          <Route path="*">404</Route>
        </Switch>
      </Router>
    </div>
  );
}

export default app;
