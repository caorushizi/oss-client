import { contextBridge, ipcRenderer } from "electron/renderer";
import remote from "@electron/remote";
import {
  addApp,
  changeSetting,
  clearTransferDoneList,
  deleteApp,
  deleteFiles,
  downloadFiles,
  getAppsChannel,
  getBuckets,
  getConfig,
  getFileUrl,
  getTransfers,
  initOss,
  refreshBucket,
  showAlert,
  showConfirm,
  showWindow,
  switchBucket,
  updateApp,
  uploadFiles,
} from "./ipcChannel";

const apiKey = "electron";

const buildMenuFromTemplate = (
  template: Electron.MenuItemConstructorOptions[]
) => {
  console.log(remote, "remote");
  const menu = remote.Menu.buildFromTemplate(template);
  menu.popup();
};

const showOpenDialog = (options: Electron.OpenDialogOptions) => {
  return remote.dialog.showOpenDialog(options);
};

const appGetPath = (
  name:
    | "home"
    | "appData"
    | "userData"
    | "cache"
    | "temp"
    | "exe"
    | "module"
    | "desktop"
    | "documents"
    | "downloads"
    | "music"
    | "pictures"
    | "videos"
    | "recent"
    | "logs"
    | "crashDumps"
) => {
  return remote.app.getPath(name);
};

const showItemInFolder = (fullPath: string) => {
  remote.shell.showItemInFolder(fullPath);
};

/**
 * @see https://github.com/electron/electron/issues/21437#issuecomment-573522360
 */
const api: any = {
  versions: process.versions,
  switchBucket,
  refreshBucket,
  getBuckets,
  getAppsChannel,
  initOss,
  getTransfers,
  addApp,
  updateApp,
  deleteApp,
  clearTransferDoneList,
  changeSetting,
  deleteFiles,
  getConfig,
  showAlert,
  showConfirm,
  uploadFiles,
  downloadFiles,
  getFileUrl,
  closeConfirmWindow: () => {
    ipcRenderer.send("close-confirm", false);
  },
  onIpcEvent: ipcRenderer.on,
  removeIpcEvent: ipcRenderer.removeListener,
  closeAlertWindow: () => {
    ipcRenderer.send("close-alert");
  },
  platform: process.platform,
  showWindow,
  buildMenuFromTemplate,
  showOpenDialog,
  appGetPath,
  showItemInFolder,
};

if (process.env.NODE_ENV !== "production") {
  /**
   * The "Main World" is the JavaScript context that your main renderer code runs in.
   * By default, the page you load in your renderer executes code in this world.
   *
   * @see https://www.electronjs.org/docs/api/context-bridge
   */
  contextBridge.exposeInMainWorld(apiKey, api);
} else {
  /**
   * Recursively Object.freeze() on objects and functions
   * @see https://github.com/substack/deep-freeze
   * @param obj Object on which to lock the attributes
   */
  const deepFreeze = (obj: any) => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    if (typeof obj === "object" && obj !== null) {
      Object.keys(obj).forEach((prop) => {
        const val = obj[prop];
        if (
          (typeof val === "object" || typeof val === "function") &&
          !Object.isFrozen(val)
        ) {
          deepFreeze(val);
        }
      });
    }

    return Object.freeze(obj);
  };

  deepFreeze(api);

  window[apiKey] = api;

  // Need for Spectron tests
  window.electronRequire = require;
}
