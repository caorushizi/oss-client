import { App, AppMode, AppType } from "../models/app";
import { ADD_APP, AppUnionType } from "../actions/app.actions";

export interface AppState {
  apps: App[];
  mode: AppMode;
  active: string;
}

const initialState: AppState = {
  apps: [
    {
      type: AppType.qiniu,
      name: "七牛云1",
      ak: "123123123123",
      sk: "123123123123",
    },
    {
      type: AppType.qiniu,
      name: "七牛云2",
      ak: "123123123123",
      sk: "123123123123",
    },
  ],
  mode: AppMode.view,
  active: "123123",
};

export default function appReducer(
  state = initialState,
  action: AppUnionType
): AppState {
  switch (action.type) {
    case ADD_APP:
      const app = action.payload;
      return {
        apps: [...state.apps, app],
        mode: AppMode.add,
        active: app.name,
      };
    default:
      return state;
  }
}
