import { combineReducers } from "redux";
import { connectRouter, RouterState } from "connected-react-router";
import { History } from "history";
import ossReducer, { OssState } from "./oss.reducer";

export interface AppState {
  router: RouterState;
  app: OssState;
}

const createRootReducer = (history: History) => {
  return combineReducers({
    router: connectRouter(history),
    app: ossReducer,
  });
};

export default createRootReducer;
