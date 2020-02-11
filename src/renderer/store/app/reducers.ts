import { Vdir } from "../../lib/vdir";
import { AppActionTypes, AppState, GET_VDIR, SET_VDIR, SET_COLOR } from "./types";

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
const initialState: AppState = {
  vdir: new Vdir("#"),
  appColor: getColor().appColor,
  asideColor: getColor().asideColor
};

export function appReducer(state = initialState, action: AppActionTypes): AppState {
  switch (action.type) {
    case GET_VDIR:
      return state;
    case SET_VDIR:
      return { ...state, vdir: action.vdir };
    case SET_COLOR:
      return { ...state, appColor: getColor().appColor, asideColor: getColor().asideColor };
    default:
      return state;
  }
}
