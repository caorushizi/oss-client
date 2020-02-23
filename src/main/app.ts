import { app, ipcMain } from "electron";
import { MainWindow, FloatWindow } from "./windows";
import { IpcChannelInterface } from "./IPC/IpcChannelInterface";
import { Platform } from "../MainWindow/types";
import AppTray from "./tray";
import { SwitchBucketChannel } from "./IPC/SwitchBucketChannel";
import { GetBucketsChannel } from "./IPC/GetBucketsChannel";

export default class App {
  private mainWindow: MainWindow;

  private floatWindow: FloatWindow;

  private appTray: AppTray;

  constructor() {
    // todo: require
    // eslint-disable-next-line global-require
    if (require("electron-squirrel-startup")) {
      app.quit();
    }

    this.mainWindow = new MainWindow();
    console.log("main window: ", this.mainWindow);
    this.floatWindow = new FloatWindow();
    this.appTray = new AppTray();
  }

  init() {
    // 初始化 ipc 通道
    this.registerIpcChannels([
      new SwitchBucketChannel(),
      new GetBucketsChannel()
    ]);

    // 初始化 app
    app.on("ready", () => {
      this.appReady();
    });
    app.on("activate", () => {
      this.onActive();
    });
    app.on("window-all-closed", this.onWindowAllClosed);
  }

  onActive() {
    this.mainWindow.onActivate();
    this.floatWindow.onActivate();
  }

  appReady() {
    console.log(this.mainWindow);
    this.mainWindow.createWindow();
    if (process.platform === Platform.windows) {
      console.log("在 windows 上运行");
      this.floatWindow.createWindow();
    }
    this.appTray.init();
  }

  onWindowAllClosed = () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  };

  private registerIpcChannels = (ipcChannels: IpcChannelInterface[]) => {
    ipcChannels.forEach(channel =>
      ipcMain.on(channel.getName(), (event, request) =>
        channel.handle(event, request)
      )
    );
  };
}
