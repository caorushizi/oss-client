import { CombinedState, combineReducers, Reducer } from "redux";
import { connectRouter, RouterState } from "connected-react-router";
import { History } from "history";

export interface AppState {
  router: RouterState;
}

const createRootReducer = (
  history: History
): Reducer<CombinedState<AppState>> => {
  return combineReducers({
    router: connectRouter(history)
  });
};

export default createRootReducer;
