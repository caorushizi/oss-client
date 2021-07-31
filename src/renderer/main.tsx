import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "./theme";
import { Provider } from "react-redux";
import store, { history } from "./store";
import { ConnectedRouter } from "connected-react-router";

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </ConnectedRouter>
  </Provider>,
  document.getElementById("root")
);
