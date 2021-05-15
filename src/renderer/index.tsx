import React from "react";
import reactDom from "react-dom";
import "normalize.css/normalize.css";
import "antd/dist/antd.css";
import "./index.scss";
import { Spin } from "antd";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { LoadingOutlined } from "@ant-design/icons";
import Float from "renderer/pages/float";
import Alert from "renderer/pages/alert";
import Confirm from "renderer/pages/confirm";
import Main from "renderer/pages/main/App";

Spin.setDefaultIndicator(
  <LoadingOutlined style={{ fontSize: 25, color: "#fff" }} />
);

reactDom.render(
  <Router>
    <Switch>
      <Route path="/float">
        <Float />
      </Route>
      <Route path="/alert">
        <Alert />
      </Route>
      <Route path="/confirm">
        <Confirm />
      </Route>
      <Route path="/">
        <Main />
      </Route>
    </Switch>
  </Router>,
  document.getElementById("root")
);
