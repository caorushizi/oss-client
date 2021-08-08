import { contextBridge } from "electron";
import axios from "axios";
import { ipcRenderer } from "electron";
import { GET_QINIU_TOKEN } from "../constants/oss";

export function getQiniuToken(
  ak: string,
  sk: string,
  url: string
): Promise<string> {
  return ipcRenderer.invoke(GET_QINIU_TOKEN, ak, sk, url);
}

const apiKey = "electron";
const api: ElectronApi = {
  versions: process.versions,
  getQiniuToken,
  request: axios,
};

contextBridge.exposeInMainWorld(apiKey, api);
