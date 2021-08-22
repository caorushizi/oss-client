import React, { FC } from "react";
import { BrowserRouter, Redirect, Route } from "react-router-dom";
import MainPage from "./nodes/main-page";
import TestPage from "./nodes/test-page";
import { Box } from "@chakra-ui/react";

const App: FC = () => {
  return (
    <Box className="App">
      <BrowserRouter>
        <Route path="/main" component={MainPage} />
        <Route path="/test" component={TestPage} />
        <Redirect to="/main/bucket/1" />
      </BrowserRouter>
    </Box>
  );
};

export default App;
