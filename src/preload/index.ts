import { contextBridge } from "electron";
import { getBuckets } from "./oss";
import request from "./request";

const apiKey = "electron";
const api: ElectronApi = {
  versions: process.versions,
  getBuckets,
  request,
};

contextBridge.exposeInMainWorld(apiKey, api);
