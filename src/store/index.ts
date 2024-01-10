import { configureStore } from "@reduxjs/toolkit";
import appReducer from "./appSlice";
import { appApi } from "../api";

export const store = configureStore({
  reducer: {
    app: appReducer,
    [appApi.reducerPath]: appApi.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().concat(appApi.middleware);
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
