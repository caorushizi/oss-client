import { BrowserWindow, screen } from "electron";

declare const FLOAT_WINDOW_WEBPACK_ENTRY: string;
export default class FloatWindow {
  private window: BrowserWindow | null = null;

  createWindow(): void {
    this.window = new BrowserWindow({
      transparent: true,
      frame: false,
      webPreferences: { nodeIntegration: true },
      height: 100,
      width: 100,
      alwaysOnTop: true,
      resizable: false,
      type: "toolbar"
    });

    const size = screen.getPrimaryDisplay().workAreaSize;
    const winSize = this.window.getSize();

    this.window.setPosition(size.width - winSize[0] - 100, 100);

    if (process.env.NODE_ENV === "development")
      this.window.webContents.openDevTools();

    this.window.loadURL(FLOAT_WINDOW_WEBPACK_ENTRY).then(() => {});

    this.window.on("closed", () => {
      this.window = null;
    });
  }

  onActivate(): void {
    if (!this.window) {
      this.createWindow();
    }
  }
}
