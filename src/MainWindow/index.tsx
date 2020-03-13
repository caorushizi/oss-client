import React from "react";
import reactDom from "react-dom";
import "normalize.css/normalize.css";

import App from "./App";
import "./index.scss";

reactDom.render(<App />, document.getElementById("root"));

/**
 * TODO LIST
 * 1、在渲染进程中不使用 node；
 * 2、熟悉脚手架工具；
 * 3、mobx
 * 4、Immutable.js
 */
