// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcRenderer, IpcRendererEvent } from "electron";

export function getBuckets(cb: listener) {
  ipcRenderer.send("get-buckets-request");
  ipcRenderer.on("get-buckets-response", cb);
}
export function getFiles(name: string) {
  ipcRenderer.send("get-files-request", name);
}

type listener = (event: IpcRendererEvent, ...args: any[]) => void;
