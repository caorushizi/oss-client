import { app, Menu, Tray } from "electron";
import * as path from "path";

export default class AppTray {
  private readonly iconPath: string;

  private tray: Tray | null = null;

  constructor() {
    this.iconPath = path.join(__dirname, "../../static/tray-icon.png");
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
