import { app } from "electron";
import index from "./bootstrap";
import { initTray } from "./tray";
import { initWindows } from "./windows";

// todo: require
// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit();
}

initWindows();

initTray();

index();
