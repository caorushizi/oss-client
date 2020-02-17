import { app, BrowserWindow } from "electron";
import bootstrap from "./bootstrap";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const FLOAT_WINDOW_WEBPACK_ENTRY: string;

// todo: require
// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: Electron.BrowserWindow | null;
let floatWindow: Electron.BrowserWindow | null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    frame: false,
    height: 600,
    // FIXME: 渲染进程不使用 node
    webPreferences: { nodeIntegration: true },
    width: 930,
    titleBarStyle: "hiddenInset"
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY).then(() => {
    console.log("main page loaded ~");
  });

  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  floatWindow = new BrowserWindow({
    transparent: true,
    frame: false,
    height: 100,
    width: 100
  });

  floatWindow.loadURL(FLOAT_WINDOW_WEBPACK_ENTRY).then(() => {
    console.log("float window loaded~");
  });

  floatWindow.on("closed", () => {
    floatWindow = null;
  });
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

bootstrap();
