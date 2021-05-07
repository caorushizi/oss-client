import React from "react";
import reactDom from "react-dom";
import "normalize.css/normalize.css";
import "antd/dist/antd.css";
import "./index.scss";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import App from "./App";

Spin.setDefaultIndicator(
  <LoadingOutlined style={{ fontSize: 25, color: "#fff" }} />
);

reactDom.render(<App />, document.getElementById("root"));
