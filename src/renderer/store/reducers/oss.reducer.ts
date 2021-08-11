import { Oss, OssMode } from "../models/oss";
import { ADD_OSS, AppUnionType } from "../actions/oss.actions";

export interface OssState {
  apps: Oss[];
  mode: OssMode;
  active: string;
}

const initialState: OssState = {
  apps: [],
  mode: OssMode.view,
  active: "",
};

export default function ossReducer(
  state = initialState,
  action: AppUnionType
): OssState {
  switch (action.type) {
    case ADD_OSS:
      const oss = action.payload;
      return {
        apps: [...state.apps, oss],
        mode: OssMode.add,
        active: oss.name,
      };
    default:
      return state;
  }
}
