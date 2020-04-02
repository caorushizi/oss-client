import {
  app,
  ipcMain,
  BrowserWindow,
  screen,
  nativeImage,
  MenuItemConstructorOptions,
  MenuItem,
  Menu,
  Tray
} from "electron";
import { IpcChannelInterface } from "./IPC/IpcChannelInterface";
import { Platform } from "../MainWindow/helper/enums";
import { SwitchBucketChannel } from "./IPC/SwitchBucketChannel";
import { GetBucketsChannel } from "./IPC/GetBucketsChannel";
import { AddAppChannel } from "./IPC/AddAppChannel";
import { GetAppsChannel } from "./IPC/GetAppsChannel";
import { InitAppChannel } from "./IPC/InitAppChannel";
import { GetTransfersChannel } from "./IPC/GetTransfersChannel";
import { UpdateAppChannel } from "./IPC/UpdateAppChannel";
import { DeleteAppChannel } from "./IPC/DeleteAppChannel";
import { ClearTransferDoneListChannel } from "./IPC/ClearTransferDoneListChannel";
import { getPlatform } from "../MainWindow/helper/utils";
import TrayIcon from "./tray-icon.png";

/**
 * 现只考虑 windows 平台和 mac 平台
 *
 * 在 windows 上
 * - 显示主页面
 * - 设置
 * - 退出程序
 *
 * 在 mac 上
 * - 显示主页面
 * - 设置
 * - 分割线
 * - 最近传输列表
 * - 分割线
 * - 清空最近记录
 * - 使用 markdown 格式
 * - 退出程序
 */

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const FLOAT_WINDOW_WEBPACK_ENTRY: string;

export default class App {
  mainWindow: BrowserWindow | null = null;

  floatWindow: BrowserWindow | null = null;

  appTray: Tray | null = null;

  constructor() {
    // eslint-disable-next-line global-require
    if (require("electron-squirrel-startup")) {
      app.quit();
    }
  }

  init() {
    // 初始化 ipc 通道
    this.registerIpcChannels([
      new SwitchBucketChannel(),
      new GetBucketsChannel(),
      new AddAppChannel(),
      new GetAppsChannel(),
      new InitAppChannel(),
      new GetTransfersChannel(),
      new UpdateAppChannel(),
      new DeleteAppChannel(),
      new ClearTransferDoneListChannel()
    ]);

    // 初始化 app
    app.on("ready", () => {
      // 初始化 托盘图标
      const icon = nativeImage.createFromDataURL(TrayIcon);
      this.appTray = new Tray(icon);

      const menuTemplate: MenuItemConstructorOptions[] | MenuItem[] = [
        { label: "显示主窗口" },
        { label: "设置" }
      ];
      if (getPlatform() !== Platform.windows) {
        menuTemplate.concat([
          { type: "separator" },
          { label: "最近记录" },
          { type: "separator" },
          { label: "清空最近记录" },
          { label: "使用 markdown 格式" }
        ]);
      }
      menuTemplate.push({
        label: "关闭程序",
        click() {
          app.quit();
        }
      });
      const contextMenu = Menu.buildFromTemplate(menuTemplate);
      this.appTray.setToolTip("云存储客户端");
      this.appTray.setContextMenu(contextMenu);
      // 初始化主窗口
      this.mainWindow = new BrowserWindow({
        frame: false,
        height: 645,
        webPreferences: { nodeIntegration: true },
        width: 1090,
        titleBarStyle: "hiddenInset"
      });
      this.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY).then(() => {});

      if (process.env.NODE_ENV === "development") {
        this.mainWindow.webContents.openDevTools();
      }

      this.mainWindow.on("closed", () => {
        if (this.mainWindow) this.mainWindow = null;
      });
      // 初始化悬浮窗
      if (getPlatform() === Platform.windows) {
        this.floatWindow = new BrowserWindow({
          transparent: true,
          frame: false,
          webPreferences: { nodeIntegration: true },
          height: 85,
          width: 85,
          alwaysOnTop: true,
          resizable: false,
          type: "toolbar"
        });

        if (process.env.NODE_ENV === "development") {
          this.floatWindow.webContents.openDevTools();
        }

        const size = screen.getPrimaryDisplay().workAreaSize;
        const winSize = this.floatWindow.getSize();

        this.floatWindow.setPosition(size.width - winSize[0] - 100, 100);

        this.floatWindow.loadURL(FLOAT_WINDOW_WEBPACK_ENTRY).then(() => {});

        this.floatWindow.on("closed", () => {
          if (this.floatWindow) this.floatWindow = null;
        });
      }

      this.appTray.on("click", () => {
        if (this.mainWindow) {
          if (this.mainWindow.isVisible()) {
            this.mainWindow.hide();
          } else {
            this.mainWindow.show();
          }
        }
      });
    });

    app.on("window-all-closed", () => {
      if (getPlatform() !== Platform.macos) {
        app.quit();
      }
    });
  }

  private registerIpcChannels = (ipcChannels: IpcChannelInterface[]) => {
    ipcChannels.forEach(channel =>
      ipcMain.on(channel.getName(), (event, request) =>
        channel.handle(event, request)
      )
    );
  };
}
