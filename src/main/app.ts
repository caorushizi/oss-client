import {
  app,
  ipcMain,
  BrowserWindow,
  screen,
  nativeImage,
  MenuItemConstructorOptions,
  Menu,
  Tray,
  clipboard
} from "electron";
import { injectable } from "inversify";
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
import { getRecentUploadList } from "./store/transfers";
import { configStore } from "./store/config";
import { GetUploadTransfersChannel } from "./IPC/GetUploadTransfersChannel";
import { GetConfigChannel } from "./IPC/GetConfigChannel";
import { IApp } from "./interface";

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

@injectable()
export default class App implements IApp {
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
      new GetUploadTransfersChannel(),
      new ClearTransferDoneListChannel(),
      new GetConfigChannel()
    ]);

    // 初始化 app
    app.on("ready", async () => {
      // 初始化 托盘图标
      const icon = nativeImage.createFromDataURL(TrayIcon);
      this.appTray = new Tray(icon);

      let menuTemplate: MenuItemConstructorOptions[] = [
        {
          label: "显示悬浮窗",
          visible: getPlatform() === Platform.windows,
          type: "checkbox",
          checked: true,
          click: item => {
            if (this.floatWindow) {
              if (item.checked) {
                this.floatWindow.show();
              } else {
                this.floatWindow.hide();
              }
            }
          }
        },
        {
          label: "设置",
          click: () => {
            if (this.mainWindow) {
              this.mainWindow.show();
              this.mainWindow.webContents.send("to-setting");
            }
          }
        }
      ];
      if (getPlatform() === Platform.macos) {
        const recentListStore = await getRecentUploadList();
        const recentList: MenuItemConstructorOptions[] =
          recentListStore.length > 0
            ? recentListStore.splice(0, 5).map(i => ({
                label: i.name,
                click: () => {
                  if (configStore.get("markdown")) {
                    clipboard.write({
                      text: `![${i.name}](图片链接 "http://${i.name}")`
                    });
                  } else {
                    clipboard.write({ text: i.name });
                  }
                }
              }))
            : [
                {
                  label: "暂无最近使用",
                  enabled: false
                }
              ];

        menuTemplate = menuTemplate.concat([
          { type: "separator" },
          ...recentList,
          { type: "separator" },
          { label: "清空最近记录" },
          {
            label: "使用 markdown 格式",
            type: "checkbox",
            checked: configStore.get("markdown"),
            click: () => {
              const markdown = configStore.get("markdown");
              configStore.set("markdown", !markdown);
            }
          }
        ]);
      }
      menuTemplate = menuTemplate.concat([
        { type: "separator" },
        {
          label: "关闭程序",
          click() {
            app.quit();
          }
        }
      ]);
      const contextMenu = Menu.buildFromTemplate(menuTemplate);
      this.appTray.setToolTip("云存储客户端");
      this.appTray.setContextMenu(contextMenu);
      // 初始化主窗口
      this.mainWindow = new BrowserWindow({
        frame: false,
        height: 645,
        width: 1090,
        minHeight: 350,
        minWidth: 750,
        webPreferences: { nodeIntegration: true },
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
          height: 50,
          width: 110,
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
