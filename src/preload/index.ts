import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  doThing: () => ipcRenderer.send("do-a-thing"),
});
