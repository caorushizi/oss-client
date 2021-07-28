import React, { FC } from "react";
import "./App.scss";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import MainPage from "./nodes/main-page";
import TestPage from "./nodes/test-page";
import Bucket from "./nodes/main-page/bucket";
import TransferList from "./nodes/main-page/transfer-done";
import TransferDone from "./nodes/main-page/transfer-list";
import Settings from "./nodes/main-page/settings";
import Apps from "./nodes/main-page/apps";

const App: FC = () => {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/main/*" element={<MainPage />}>
            <Route path="bucket">
              <Route path="/" element={<Bucket />} />
              <Route path=":id" element={<Bucket />} />
            </Route>
            <Route path="transfer-list" element={<TransferList />} />
            <Route path="transfer-done" element={<TransferDone />} />
            <Route path="settings" element={<Settings />} />
            <Route path="apps" element={<Apps />} />
          </Route>
          <Route path="/test" element={<TestPage />} />
          <Navigate to="/main/bucket" />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
