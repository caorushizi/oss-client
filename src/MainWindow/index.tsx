import React from "react";
import reactDom from "react-dom";
import "normalize.css/normalize.css";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import "rc-switch/assets/index.css";

import App from "./App";
import "./index.scss";

library.add(fas);

reactDom.render(<App />, document.getElementById("root"));
