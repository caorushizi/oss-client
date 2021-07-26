import React, { FC, useState } from "react";
import "./App.css";
import { Route } from "react-router";
import { BrowserRouter as Router } from "react-router-dom";
import Main from "./nodes/main";

const App: FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <Router>
        <Route path="/" element={<Main />} />
      </Router>

      <button type="button" onClick={() => setCount((count) => count + 1)}>
        count is: {count}
      </button>
    </div>
  );
};

export default App;
