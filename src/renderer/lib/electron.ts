export const {
  ipcRenderer,
  remote,
  clipboard
}: {
  ipcRenderer: Electron.IpcRenderer;
  remote: Electron.Remote;
  clipboard: Electron.Clipboard;
} = window.require("electron");
