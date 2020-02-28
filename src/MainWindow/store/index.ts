import { combineReducers } from "redux";
import { appReducer } from "./app/reducers";

debugger
export const rootReducer: any = combineReducers({
  app: appReducer
});

export type RootState = ReturnType<typeof rootReducer>;
