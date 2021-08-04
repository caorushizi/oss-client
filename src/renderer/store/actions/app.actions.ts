import { App } from "../models/app";

export const GET_APPS = "GET_APPS";
export const ADD_APP = "ADD_APP";

export interface GetApps {
  type: typeof GET_APPS;
}

export const getApps = (): GetApps => ({
  type: GET_APPS,
});

export interface AddApp {
  type: typeof ADD_APP;
  payload: App;
}

export const addApp = (app: App): AddApp => ({
  type: ADD_APP,
  payload: app,
});

export type AppUnionType = GetApps | AddApp;
