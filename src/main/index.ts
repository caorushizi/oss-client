import path from "path";
import { app, BrowserWindow } from "electron";
import { is } from "electron-util";
import unhandled from "electron-unhandled";
import debug from "electron-debug";
import "./ipc";
import registerIpc from "./ipc";

unhandled();
debug();

app.setAppUserModelId("com.company.AppName");

let mainWindow: Electron.BrowserWindow | undefined;

const createMainWindow = async () => {
  const win = new BrowserWindow({
    frame: false,
    height: 645,
    width: 1090,
    minHeight: 350,
    minWidth: 750,
    webPreferences: {
      nodeIntegration: true,
      devTools: is.development,
      preload: path.resolve(__dirname, "../preload"),
    },
    titleBarStyle: "hiddenInset",
    show: false,
  });

  win.on("ready-to-show", () => {
    win.show();
  });

  win.on("closed", () => {
    mainWindow = undefined;
  });

  if (is.development) {
    await win.loadURL("http://localhost:7789/");
  } else {
    await win.loadFile(path.join(__dirname, "index.html"));
  }

  return win;
};

// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.show();
  }
});

app.on("window-all-closed", () => {
  if (!is.macos) {
    app.quit();
  }
});

app.on("activate", async () => {
  if (!mainWindow) {
    mainWindow = await createMainWindow();
  }
});

(async () => {
  await app.whenReady();
  registerIpc();
  mainWindow = await createMainWindow();
})();
