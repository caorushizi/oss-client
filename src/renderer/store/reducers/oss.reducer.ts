import { OssMode } from "../models/oss";
import {
  ADD_OSS,
  AppUnionType,
  SET_ACTIVE_S3,
  SET_APPS,
} from "../actions/oss.actions";

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
    case SET_APPS:
      const apps = action.payload;
      const active = apps[0].name;
      return {
        ...state,
        apps,
        active,
      };
    case SET_ACTIVE_S3:
      return {
        ...state,
        active: action.payload,
      };
    default:
      return state;
  }
}
