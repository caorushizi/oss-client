import { Oss } from "../models/oss";

export const GET_OSS_LIST = "GET_OSS_LIST";
export const ADD_OSS = "ADD_OSS";

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

export type AppUnionType = GetOssList | AddOss;
