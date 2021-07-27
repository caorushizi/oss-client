import React, { FC } from "react";
import "./App.css";
import { Route, Routes, Navigate } from "react-router";
import { BrowserRouter as Router } from "react-router-dom";
import MainPage from "./nodes/main-page";
import TestPage from "./nodes/test-page";

const App: FC = () => {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/main" element={<MainPage />} />
          <Route path="/test" element={<TestPage />} />
          <Navigate to="/main" />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
