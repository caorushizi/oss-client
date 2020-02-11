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

const styles = [
  {
    appColor: "linear-gradient(#8B5C68, #37394E)",
    asideColor: "linear-gradient(#8B5C68, #484B58)"
  },
  {
    appColor: "linear-gradient(#875D56, #3A3B4E)",
    asideColor: "linear-gradient(#895E56, #444A57)"
  },
  {
    appColor: "linear-gradient(#546F67, #333B4E)",
    asideColor: "linear-gradient(#557067, #444B57)"
  },
  {
    appColor: "linear-gradient(#7D5A86, #39394E)",
    asideColor: "linear-gradient(#7C5985, #484B58)"
  },
  {
    appColor: "linear-gradient(#80865A, #39394E)",
    asideColor: "linear-gradient(#80865A, #39394E)"
  },
  {
    appColor: "linear-gradient(#8B5C68, #37394E)",
    asideColor: "linear-gradient(#8B5C68, #484B58)"
  }
];

const getColor = () => styles[Math.floor(Math.random() * styles.length)];
const initialColor = getColor();

const initialState: AppState = {
  vdir: new Vdir("#"),
  layout: Layout.grid,
  page: Page.bucket,
  ...initialColor
};

export function appReducer(state = initialState, action: AppActionTypes): AppState {
  switch (action.type) {
    case GET_VDIR:
      return state;
    case SET_VDIR:
      return { ...state, ...action.payload };
    case SET_COLOR:
      return { ...state, ...getColor() };
    case SWITCH_LAYOUT:
      return { ...state, ...action.payload };
    case SWITCH_PAGE:
      return { ...state, ...action.payload };
    default:
      return state;
  }
}
