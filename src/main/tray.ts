import { app, Menu, Tray } from "electron";

export function initTray() {
  let tray = null;
  app.on("ready", () => {
    tray = new Tray("C:\\Workspace\\Github\\oss-client\\src\\main\\icon.ico");
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
