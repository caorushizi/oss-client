import { getThemeColor } from "../../helper/utils";
import { Vdir } from "../../lib/vdir";
import {
  AppActionTypes,
  AppState,
  CHANGE_NOTIFIER,
  Direction,
  GET_VDIR,
  Layout,
  Page,
  SET_COLOR,
  SET_TRANSFERS,
  SET_VDIR,
  SWITCH_LAYOUT,
  SWITCH_PAGE
} from "./types";

const initialColor = getThemeColor();

const initialState: AppState = {
  vdir: new Vdir("#"),
  layout: Layout.table,
  page: Page.bucket,
  ...initialColor,
  direction: Direction.down,
  transfers: [],
  notifier: false
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
      return {
        ...state,
        ...action.payload,
        direction:
          state.page < action.payload.page ? Direction.down : Direction.up
      };
    case SET_TRANSFERS:
      return { ...state, ...action.payload };
    case CHANGE_NOTIFIER:
      return { ...state, notifier: !state.notifier };
    default:
      return state;
  }
}
