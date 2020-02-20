import { app, Menu, Tray } from "electron";
import * as path from "path";
import { Platform } from "../MainWindow/types";

const dirname = path.dirname(__filename);
const iconPath =
  process.platform === Platform.windows
    ? path.join(dirname, "../../src/main/icon.ico")
    : "/Users/caorushizi/Desktop/icon.icns";

export function initTray() {
  let tray = null;
  app.on("ready", () => {
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      { label: "Item1", type: "radio" },
      { label: "Item2", type: "radio" },
      { label: "Item3", type: "radio", checked: true },
      { label: "Item4", type: "radio" }
    ]);
    tray.setToolTip("This is my application.");
    tray.setContextMenu(contextMenu);
  });
}
