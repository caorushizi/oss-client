import { Vdir } from "../../lib/vdir";
import {
  AppActionTypes,
  AppState,
  GET_VDIR,
  Layout,
  Page,
  SET_COLOR,
  SET_VDIR,
  SWITCH_LAYOUT,
  SWITCH_PAGE
} from "./types";
import { getThemeColor } from "../../helper/utils";

const initialColor = getThemeColor();

const initialState: AppState = {
  vdir: new Vdir("#"),
  layout: Layout.grid,
  page: Page.bucket,
  ...initialColor
};

export function appReducer(
  state = initialState,
  action: AppActionTypes
): AppState {
  switch (action.type) {
    case GET_VDIR:
      return state;
    case SET_VDIR:
      return { ...state, ...action.payload };
    case SET_COLOR:
      return { ...state, ...getThemeColor() };
    case SWITCH_LAYOUT:
      return { ...state, ...action.payload };
    case SWITCH_PAGE:
      return { ...state, ...action.payload };
    default:
      return state;
  }
}
