import { combineReducers } from "redux";
import { appReducer } from "./app/reducers";
import { counterReducer } from "./counter/reducers";

export const rootReducer: any = combineReducers({
  counter: counterReducer,
  app: appReducer
});

export type RootState = ReturnType<typeof rootReducer>;
