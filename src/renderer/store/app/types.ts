import { Vdir } from "../../lib/vdir";

export interface AppState {
  vdir: Vdir;
  appColor: string;
  asideColor: string;
}

export const SET_VDIR = "SET_VDIR";
export const GET_VDIR = "GET_VDIR";
export const SET_COLOR = "SET_COLOR";

interface GetVdirAction {
  type: typeof GET_VDIR;
}

interface SetVdirAction {
  type: typeof SET_VDIR;
  vdir: Vdir;
}

interface RandomColor {
  type: typeof SET_COLOR;
}

export type AppActionTypes = GetVdirAction | SetVdirAction | RandomColor;
