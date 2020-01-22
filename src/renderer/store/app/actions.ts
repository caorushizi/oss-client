import { AppActionTypes, GET_VDIR, SET_VDIR } from "./types";
import { Vdir } from "../../lib/vdir";

export function setVdir(vdir: Vdir): AppActionTypes {
  return { vdir, type: SET_VDIR };
}

export function getVdir(): AppActionTypes {
  return {
    type: GET_VDIR
  };
}
