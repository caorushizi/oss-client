import { combineReducers } from "redux";
import productReducer, { ProductState } from "./product.reducer";
import { connectRouter, RouterState } from "connected-react-router";
import { History } from "history";

export interface AppState {
  router: RouterState;
  product: ProductState;
}

const createRootReducer = (history: History) => {
  return combineReducers({
    router: connectRouter(history),
    product: productReducer,
  });
};

export default createRootReducer;
