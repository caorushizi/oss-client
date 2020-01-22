import { Vdir } from "../../lib/vdir";

export interface AppState {
  vdir: Vdir;
}

export const SET_VDIR = "SET_VDIR";
export const GET_VDIR = "GET_VDIR";

interface GetVdirAction {
  type: typeof GET_VDIR;
}

interface SetVdirAction {
  type: typeof SET_VDIR;
  vdir: Vdir;
}

export type AppActionTypes = GetVdirAction | SetVdirAction;
