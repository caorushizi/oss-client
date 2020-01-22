import { combineReducers } from "redux";
import { appReducer } from "./app/reducers";
import { counterReducer } from "./counter/reducers";

const rootReducer: any = combineReducers({
  counter: counterReducer,
  app: appReducer
});

type RootState = ReturnType<typeof rootReducer>;

export default { rootReducer };
