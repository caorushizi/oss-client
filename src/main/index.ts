import path from "path";

import { app, BrowserWindow } from "electron";
import { is } from "electron-util";
import unhandled from "electron-unhandled";
import debug from "electron-debug";
// import contextMenu from "electron-context-menu";
/// const {autoUpdater} = require('electron-updater');
// import menu from "./menu.js";

unhandled();
debug();
// contextMenu();

// Note: Must match `build.appId` in package.json
app.setAppUserModelId("com.company.AppName");

// Uncomment this before publishing your first version.
// It's commented out as it throws an error if there are no published versions.
// if (!is.development) {
// 	const FOUR_HOURS = 1000 * 60 * 60 * 4;
// 	setInterval(() => {
// 		autoUpdater.checkForUpdates();
// 	}, FOUR_HOURS);
//
// 	autoUpdater.checkForUpdates();
// }

// Prevent window from being garbage collected
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
    },
    titleBarStyle: "hiddenInset",
    show: false,
  });

  win.on("ready-to-show", () => {
    win.show();
  });

  win.on("closed", () => {
    // Dereference the window
    // For multiple windows store them in an array
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
  // Menu.setApplicationMenu(menu);
  mainWindow = await createMainWindow();
})();
