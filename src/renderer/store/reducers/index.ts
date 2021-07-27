import { combineReducers } from "redux";
import productReducer, { ProductState } from "./product.reducer";

export interface AppState {
  product: ProductState;
}

export default combineReducers({
  product: productReducer,
});
