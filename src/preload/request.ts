import { ipcRenderer } from "electron";

const request = (params: any) => {
  return ipcRenderer.invoke("request", params);
};

export default request;
