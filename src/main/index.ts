// todo: electron
// eslint-disable-next-line import/no-extraneous-dependencies
import { app, BrowserWindow } from "electron";
import bootstrap from "./bootstrap";
import "./database";

declare const MAIN_WINDOW_WEBPACK_ENTRY: any;

// todo: require
// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: Electron.BrowserWindow | null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    height: 600,
    // FIXME: 渲染进程不使用 node
    webPreferences: { nodeIntegration: true },
    width: 800,
    titleBarStyle: "hidden"
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY).then(() => {
    console.log("page loaded ~");
  });

  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
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
