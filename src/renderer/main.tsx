import React from "react";
import reactDom from "react-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "normalize.css/normalize.css";
import "antd/dist/antd.css";
import "./main.scss";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import MainPage from "./views/main-page";
import AlertPage from "./views/alert-page";
import ConfirmPage from "./views/confirm-page";
import FloatPage from "./views/float-page";
import store from "./store";
import { Provider } from "react-redux";

Spin.setDefaultIndicator(
  <LoadingOutlined style={{ fontSize: 25, color: "#fff" }} />
);

reactDom.render(
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path="/main" element={<MainPage />} />
        <Route path="/alert" element={<AlertPage />} />
        <Route path="/confirm" element={<ConfirmPage />} />
        <Route path="/float" element={<FloatPage />} />
      </Routes>
    </BrowserRouter>
  </Provider>,
  document.getElementById("root")
);
