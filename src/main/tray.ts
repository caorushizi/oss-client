import { app, Menu, Tray } from "electron";
import * as path from "path";
import { Platform } from "../MainWindow/types";

export default class AppTray {
  private readonly iconPath: string;

  private tray: Tray | null = null;

  constructor() {
    this.iconPath =
      process.platform === Platform.windows
        ? path.join(path.dirname(__filename), "../../src/main/icon.ico")
        : "/Users/caorushizi/Desktop/icon.icns";
  }

  init() {
    this.tray = new Tray(this.iconPath);
    const contextMenu = Menu.buildFromTemplate([
      { label: "Item1", type: "radio" },
      { label: "Item2", type: "radio" },
      { label: "Item3", type: "radio", checked: true },
      { label: "Item4", type: "radio" }
    ]);
    this.tray.setToolTip("This is my application.");
    this.tray.setContextMenu(contextMenu);
  }
}
