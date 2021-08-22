import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "./theme";
import { Provider } from "react-redux";
import store, { history } from "./store";
import { ConnectedRouter } from "connected-react-router";
import "./main.scss";
import localforage from "localforage";
import { setApps } from "./store/actions/oss.actions";

async function init(): Promise<void> {
  let apps = await localforage.getItem<Oss[] | undefined>("apps");
  console.log("apps", apps);
  apps ||= [];
  console.log("apps", apps);
  store.dispatch(setApps(apps));
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
}

init();
