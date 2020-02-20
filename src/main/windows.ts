import { app, BrowserWindow, screen } from "electron";
import { Platform } from "../MainWindow/types";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const FLOAT_WINDOW_WEBPACK_ENTRY: string;

export function initWindows() {
  let mainWindow: Electron.BrowserWindow | null;
  let floatWindow: Electron.BrowserWindow | null;

  const createMainWindow = () => {
    mainWindow = new BrowserWindow({
      frame: false,
      height: 645,
      // FIXME: 渲染进程不使用 node
      webPreferences: { nodeIntegration: true },
      width: 1090,
      titleBarStyle: "hiddenInset"
    });

    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY).then(() => {
      console.log("main page loaded ~");
    });

    mainWindow.webContents.openDevTools();

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  };

  const createFloatWindow = () => {
    floatWindow = new BrowserWindow({
      transparent: true,
      frame: false,
      // FIXME: 渲染进程不使用 node
      webPreferences: { nodeIntegration: true },
      height: 100,
      width: 100,
      alwaysOnTop: true,
      resizable: false,
      type: "toolbar"
    });

    const size = screen.getPrimaryDisplay().workAreaSize;
    const winSize = floatWindow.getSize();

    floatWindow.setPosition(size.width - winSize[0] - 100, 100);

    floatWindow.loadURL(FLOAT_WINDOW_WEBPACK_ENTRY).then(() => {
      console.log("float window loaded~");
    });

    floatWindow.on("closed", () => {
      floatWindow = null;
    });
  };

  const createWindow = () => {
    createMainWindow();
    if (process.platform !== Platform.macos) {
      createFloatWindow();
    }
  };

  app.on("ready", createWindow);

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
}
