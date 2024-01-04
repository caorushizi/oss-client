import React from "react";
import reactDom from "react-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "normalize.css/normalize.css";
import "antd/dist/antd.css";
import "./main.scss";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import MainPage from "./views/main-page";
import AlertPage from "./views/alert-page";
import ConfirmPage from "./views/confirm-page";
import FloatPage from "./views/float-page";

Spin.setDefaultIndicator(
  <LoadingOutlined style={{ fontSize: 25, color: "#fff" }} />
);

reactDom.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/alert" element={<AlertPage />} />
      <Route path="/confirm" element={<ConfirmPage />} />
      <Route path="/float" element={<FloatPage />} />
    </Routes>
  </BrowserRouter>,
  document.getElementById("root")
);
