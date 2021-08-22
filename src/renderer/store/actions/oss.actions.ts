export const GET_OSS_LIST = "GET_OSS_LIST";
export const ADD_OSS = "ADD_OSS";
export const SET_APPS = "SET_APPS";
export const SET_ACTIVE_S3 = "SET_ACTIVE_S3";

export interface GetOssList {
  type: typeof GET_OSS_LIST;
}

export const getOssList = (): GetOssList => ({
  type: GET_OSS_LIST,
});

export interface AddOss {
  type: typeof ADD_OSS;
  payload: Oss;
}

export const addOss = (app: Oss): AddOss => ({
  type: ADD_OSS,
  payload: app,
});

export interface SetApps {
  type: typeof SET_APPS;
  payload: Oss[];
}

export const setApps = (apps: Oss[]): SetApps => ({
  type: SET_APPS,
  payload: apps,
});

export interface SetActiveS3 {
  type: typeof SET_ACTIVE_S3;
  payload: string;
}

export const setActiveS3 = (name: string): SetActiveS3 => ({
  type: SET_ACTIVE_S3,
  payload: name,
});

export type AppUnionType = GetOssList | AddOss | SetApps | SetActiveS3;
