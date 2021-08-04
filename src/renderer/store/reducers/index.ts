import { combineReducers, Reducer } from "redux";
import { connectRouter, RouterState } from "connected-react-router";
import { History } from "history";
import appReducer from "./app.reducer";

export interface AppState {
  router: RouterState;
  app: AppState;
}

const createRootReducer = (history: History) => {
  return combineReducers({
    router: connectRouter(history),
    app: appReducer,
  });
};

export default createRootReducer;
