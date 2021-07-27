import React, { FC } from "react";
import "./App.css";
import { Route, Routes, Navigate } from "react-router";
import { BrowserRouter as Router } from "react-router-dom";
import MainPage from "./nodes/main-page";
import TestPage from "./nodes/test-page";

console.log(window.location.pathname);

const App: FC = () => {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/main" element={<MainPage />} />
          <Route path="/test" element={<TestPage />} />
          <Navigate to="/test" />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
