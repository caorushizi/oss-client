import { Vdir } from "../../lib/vdir";

export interface AppState {
  vdir: Vdir;
  appColor: string;
  asideColor: string;
  layout: Layout;
  page: Page;
  bucket?: string;
  direction: Direction;
}

export enum Direction {
  up,
  down
}

export enum Layout {
  grid,
  table
}

export enum Page {
  bucket,
  transferList,
  transferDone,
  setting
}

export const SET_VDIR = "SET_VDIR";
export const GET_VDIR = "GET_VDIR";
export const SET_COLOR = "SET_COLOR";
export const SWITCH_LAYOUT = "SWITCH_LAYOUT";
export const SWITCH_PAGE = "SWITCH_PAGE";

interface GetVdirAction {
  type: typeof GET_VDIR;
}

interface SetVdirAction {
  type: typeof SET_VDIR;
  payload: { vdir: Vdir };
}

interface RandomColor {
  type: typeof SET_COLOR;
}

interface SwitchLayout {
  type: typeof SWITCH_LAYOUT;
  payload: { layout: Layout };
}

interface SwitchPage {
  type: typeof SWITCH_PAGE;
  payload: { page: Page; bucket?: string };
}

export type AppActionTypes =
  | GetVdirAction
  | SetVdirAction
  | RandomColor
  | SwitchLayout
  | SwitchPage;
