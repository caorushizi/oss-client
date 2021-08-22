import { contextBridge } from "electron";
import { ipcRenderer } from "electron";
import { GET_QINIU_TOKEN, REQUEST } from "../constants/oss";

export function getQiniuToken(
  ak: string,
  sk: string,
  url: string
): Promise<string> {
  return ipcRenderer.invoke(GET_QINIU_TOKEN, ak, sk, url);
}

function request(options: RequestOptions) {
  return ipcRenderer.invoke(REQUEST, options);
}

const apiKey = "electron";
const api: ElectronApi = {
  versions: process.versions,
  getQiniuToken,
  request,
};

contextBridge.exposeInMainWorld(apiKey, api);
