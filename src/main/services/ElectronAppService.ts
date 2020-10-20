import {
  app,
  BrowserWindow,
  clipboard,
  ipcMain,
  Menu,
  MenuItemConstructorOptions,
  nativeImage,
  screen,
  Tray
} from "electron";
import { inject, injectable, named } from "inversify";
import { Platform } from "../../MainWindow/helper/enums";
import { getPlatform } from "../../MainWindow/helper/utils";
import TrayIcon from "../tray-icon.png";
import { configStore } from "../helper/config";
import { IApp, ILogger, IOssService, IStore } from "../interface";
import SERVICE_IDENTIFIER from "../constants/identifiers";
import { TransferStatus, TransferStore } from "../types";
import IpcChannelsService from "./IpcChannelsService";
import { checkDirExist, emitter, fail, mkdir, success } from "../helper/utils";
import VFile from "../../MainWindow/lib/vdir/VFile";
import TAG from "../constants/tags";

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
declare const ALERT_WINDOW_WEBPACK_ENTRY: string;
declare const CONFIRM_WINDOW_WEBPACK_ENTRY: string;

@injectable()
export default class ElectronAppService implements IApp {
  mainWindow: BrowserWindow | null = null;

  floatWindow: BrowserWindow | null = null;

  alertWindow: BrowserWindow | null = null;

  confirmWindow: BrowserWindow | null = null;

  appTray: Tray | null = null;

  @inject(SERVICE_IDENTIFIER.STORE)
  @named(TAG.TRANSFER_STORE)
  // @ts-ignore
  private transfers: IStore<TransferStore>;

  // @ts-ignore
  @inject(SERVICE_IDENTIFIER.LOGGER) private logger: ILogger;

  // @ts-ignore
  @inject(SERVICE_IDENTIFIER.CHANNELS) private appChannels: IpcChannelsService;

  // @ts-ignore
  @inject(SERVICE_IDENTIFIER.OSS) private oss: IOssService;

  constructor() {
    // eslint-disable-next-line global-require
    if (require("electron-squirrel-startup")) {
      app.quit();
    }
  }

  private registerIpc = (
    eventName: string,
    handler: (data: any) => Promise<any>
  ) => {
    ipcMain.on(eventName, async (event, request: { id: string; data: any }) => {
      const { id, data } = request;
      const response = { code: 200, data: {} };
      this.logger.info(`IPC 请求 ${eventName} => `, JSON.stringify(data));
      try {
        response.data = await handler(data);
      } catch (err) {
        response.code = err.code || 500;
        response.data = err.message || "Main process error.";
      }
      this.logger.info(`IPC 响应 ${eventName} => `, JSON.stringify(response));
      event.sender.send(`${eventName}_res_${id}`, response);
    });
  };

  init() {
    // 初始化 app
    this.logger.info("开始初始化软件");
    app.on("ready", async () => {
      // 检查下载目录
      const downloadIsDir = await checkDirExist(configStore.get("downloadDir"));
      if (!downloadIsDir) await mkdir(configStore.get("downloadDir"));
      this.logger.info("初始化软件完成，开始初始化窗口以及托盘图标");
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
        const recentListStore = await this.transfers.find({});
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

      // --------------------------------------------------------------
      // |                                                            |
      // |                         初始化主窗口                         |
      // |                                                            |
      // --------------------------------------------------------------
      this.mainWindow = new BrowserWindow({
        frame: false,
        height: 645,
        width: 1090,
        minHeight: 350,
        minWidth: 750,
        webPreferences: {
          nodeIntegration: true,
          devTools: process.env.NODE_ENV === "development"
        },
        titleBarStyle: "hiddenInset",
        show: false
      });
      this.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY).then(r => r);
      this.mainWindow.on("closed", () => {
        if (this.mainWindow) this.mainWindow = null;
      });
      this.mainWindow.once("ready-to-show", () => {
        if (this.mainWindow) this.mainWindow.show();
      });

      // --------------------------------------------------------------
      // |                                                            |
      // |                         初始化悬浮窗                         |
      // |                                                            |
      // --------------------------------------------------------------
      if (getPlatform() === Platform.windows) {
        this.floatWindow = new BrowserWindow({
          transparent: true,
          frame: false,
          webPreferences: {
            nodeIntegration: true,
            devTools: false
          },
          height: 50,
          width: 110,
          alwaysOnTop: true,
          resizable: false,
          type: "toolbar",
          show: false
        });
        const size = screen.getPrimaryDisplay().workAreaSize;
        const winSize = this.floatWindow.getSize();
        this.floatWindow.setPosition(size.width - winSize[0] - 100, 100);
        this.floatWindow.loadURL(FLOAT_WINDOW_WEBPACK_ENTRY).then(r => r);
        this.floatWindow.on("closed", () => {
          if (this.floatWindow) this.floatWindow = null;
        });
        this.floatWindow.once("ready-to-show", () => {
          if (this.floatWindow) this.floatWindow.show();
        });
      }
      // --------------------------------------------------------------
      // |                                                            |
      // |                         初始化alert                         |
      // |                                                            |
      // --------------------------------------------------------------
      this.alertWindow = new BrowserWindow({
        frame: false,
        height: 200,
        width: 400,
        resizable: false,
        parent: this.mainWindow,
        webPreferences: {
          nodeIntegration: true,
          devTools: false
        },
        modal: true,
        show: false
      });
      this.alertWindow.loadURL(ALERT_WINDOW_WEBPACK_ENTRY).then(r => r);
      this.alertWindow.on("closed", () => {
        if (this.alertWindow) this.alertWindow = null;
      });
      // --------------------------------------------------------------
      // |                                                            |
      // |                         初始化confirm                       |
      // |                                                            |
      // --------------------------------------------------------------
      this.confirmWindow = new BrowserWindow({
        frame: false,
        height: 200,
        width: 400,
        resizable: false,
        parent: this.mainWindow,
        webPreferences: {
          nodeIntegration: true,
          devTools: false
        },
        modal: true,
        show: false
      });
      this.confirmWindow.loadURL(CONFIRM_WINDOW_WEBPACK_ENTRY).then(r => r);
      this.confirmWindow.on("closed", () => {
        if (this.confirmWindow) this.confirmWindow = null;
      });
      // --------------------------------------------------------------
      // |                                                            |
      // |                         初始化任务栏                         |
      // |                                                            |
      // --------------------------------------------------------------
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

    this.logger.info("初始化窗口成功，开始初始化ipc通道");
    // --------------------------------------------------------------
    // |                                                            |
    // |                   开始注册 IPC 通道                          |
    // |                                                            |
    // --------------------------------------------------------------
    this.registerIpc("update-app", async params => {
      try {
        await this.appChannels.updateApp(params);
        return success(true);
      } catch (e) {
        this.logger.error("修改 app 出错：", e);
        return fail(1, e.message);
      }
    });
    this.registerIpc("delete-app", async id => {
      if (!id) return fail(1, "id 不能为空");
      try {
        await this.appChannels.deleteApp(id);
        return success(true);
      } catch (e) {
        return fail(1, e.message);
      }
    });
    this.registerIpc("get-apps", async () => {
      try {
        const apps = await this.appChannels.getApps();
        return success(apps);
      } catch (e) {
        return fail(1, e.message);
      }
    });
    this.registerIpc("init-app", async params => {
      try {
        const appStore = await this.appChannels.initApp(params);
        return success(appStore);
      } catch (e) {
        return fail(1, e.message);
      }
    });
    this.registerIpc("add-app", async params => {
      try {
        // 开始执行添加 app 方法
        const data = await this.appChannels.addApp(params);
        return success(data);
      } catch (e) {
        return fail(1, e.message);
      }
    });
    this.registerIpc("clear-transfer-done-list", async params => {
      try {
        await this.appChannels.removeTransfers(params);
        return success(true);
      } catch (e) {
        return fail(1, e.message);
      }
    });
    this.registerIpc("get-transfer", async params => {
      try {
        const transfers = await this.appChannels.getTransfers(params);
        return success(transfers);
      } catch (e) {
        return fail(1, e.message);
      }
    });
    this.registerIpc("get-buckets", async params => {
      try {
        const buckets = await this.appChannels.getBuckets(params);
        return success(buckets);
      } catch (err) {
        return fail(1, "获取 buckets 失败，请检查 ak，sk 是否匹配！");
      }
    });
    this.registerIpc("get-config", async () => {
      try {
        const data = await this.appChannels.getConfig();
        return success(data);
      } catch (e) {
        return fail(1, e.message);
      }
    });
    this.registerIpc("switch-bucket", async params => {
      const { bucketName } = params;
      if (typeof bucketName !== "string" || bucketName === "")
        return fail(1, "参数错误");
      try {
        const obj = await this.appChannels.switchBucket(params);
        return success(obj);
      } catch (e) {
        this.logger.error("切换 bucket 时出错", e);
        return fail(1, e.message);
      }
    });
    this.registerIpc("show-alert", async options => {
      if (this.alertWindow) {
        this.alertWindow.webContents.send("options", options);
      }
      const getWaitFor = () => {
        return new Promise(resolve => {
          ipcMain.once("close-alert", () => {
            if (this.alertWindow) this.alertWindow.hide();
            resolve();
          });
        });
      };
      await getWaitFor();
      return success(true);
    });
    this.registerIpc("change-setting", async params => {
      const { key, value } = params;
      if (typeof key !== "string" || key === "") return fail(1, "参数不能为空");
      switch (key) {
        case "useHttps":
          // 是否使用 https
          if (typeof value !== "boolean") return fail(1, "参数错误");
          configStore.set("useHttps", value);
          return success(true);
        case "deleteShowDialog":
          // 删除时是否显示对话框
          if (typeof value !== "boolean") return fail(1, "参数错误");
          configStore.set("deleteShowDialog", value);
          return success(true);
        case "uploadOverwrite":
          // 是否直接覆盖原始文件
          if (typeof value !== "boolean") return fail(1, "参数错误");
          configStore.set("uploadOverwrite", value);
          return success(true);
        case "markdown":
          // 是否使用 markdown
          if (typeof value !== "boolean") return fail(1, "参数错误");
          configStore.set("markdown", value);
          return success(true);
        case "transferDoneTip":
          // 下载完成后是否播放提示音
          if (typeof value !== "boolean") return fail(1, "参数错误");
          configStore.set("transferDoneTip", value);
          return success(true);
        case "downloadDir":
          // 下载地址
          // fixme： 检查文件夹位置是否存在
          configStore.set("downloadDir", value);
          return success(true);
        case "floatWindowStyle":
          // 悬浮窗形状
          if (typeof value !== "number") return fail(1, "参数错误");
          configStore.set("floatWindowStyle", value);
          if (this.floatWindow) {
            this.floatWindow.webContents.send("switch-shape", value);
          }
          return success(true);
        case "showFloatWindow":
          // 显示悬浮窗
          if (typeof value !== "boolean") return fail(1, "参数错误");
          configStore.set("showFloatWindow", value);
          if (this.floatWindow) {
            if (value) this.floatWindow.show();
            else this.floatWindow.hide();
          }
          return success(true);
        default:
          return fail(1, "不支持该设置");
      }
    });

    this.registerIpc("show-confirm", async options => {
      if (this.confirmWindow) {
        // fixme: 提示音
        this.confirmWindow.webContents.send("options", options);
      }
      const getWaitFor = () => {
        return new Promise((resolve, reject) => {
          ipcMain.once("close-confirm", (e, flag: boolean) => {
            if (this.confirmWindow) this.confirmWindow.hide();
            if (flag) resolve();
            else reject();
          });
        });
      };
      try {
        await getWaitFor();
        return success(true);
      } catch (err) {
        return fail(1, "点击取消");
      }
    });

    this.registerIpc("delete-file", async params => {
      if (!params?.path) return fail(1, "参数错误");
      try {
        const { path } = params;
        await this.appChannels.deleteFile(path);
        return success(true);
      } catch (e) {
        this.logger.error("上传文件时出错：", e);
        return fail(1, e.message);
      }
    });

    this.registerIpc("delete-files", async params => {
      if (!params?.paths) return fail(1, "参数错误");
      try {
        const { paths } = params;
        await this.appChannels.deleteFiles(paths);
        return success(true);
      } catch (e) {
        this.logger.error("删除文件时出错：", e);
        return fail(1, e.message);
      }
    });

    this.registerIpc("download-file", async (item: VFile) => {
      try {
        await this.appChannels.downloadFile(item);
        return success(true);
      } catch (e) {
        this.logger.error("上传文件时出错：", e);
        return fail(1, e.message);
      }
    });

    this.registerIpc("download-files", async (items: VFile[]) => {
      this.logger.info(items);
      try {
        await this.appChannels.downloadFiles(items);
        return success(true);
      } catch (e) {
        this.logger.error("上传文件时出错：", e);
        return fail(1, e.message);
      }
    });

    this.registerIpc("upload-file", async params => {
      if (!("remoteDir" in params)) return fail(1, "参数错误");
      if (!("filepath" in params)) return fail(1, "参数错误");
      try {
        await this.appChannels.uploadFile(params);
        return success(true);
      } catch (e) {
        this.logger.error("上传文件时出错：", e);
        return fail(1, e.message);
      }
    });

    this.registerIpc("upload-files", async params => {
      if (!("remoteDir" in params)) return fail(1, "参数错误");
      if (!("fileList" in params)) return fail(1, "参数错误");
      const { fileList } = params;
      if (Array.isArray(fileList) && fileList.length === 0) {
        return fail(1, "参数错误");
      }
      try {
        await this.appChannels.uploadFiles(params);
        return success(true);
      } catch (e) {
        this.logger.error("上传文件时出错：", e);
        return fail(1, e.message);
      }
    });

    this.registerIpc("get-url", async key => {
      if (!key) return fail(1, "参数错误");
      try {
        const url = await this.appChannels.getFileUrl(key);
        return success(url);
      } catch (e) {
        return fail(1, e.message);
      }
    });

    // --------------------------------------------------------------
    // |                                                            |
    // |                   软件内部事件通讯机制                        |
    // |                                                            |
    // --------------------------------------------------------------

    emitter.on("transfer-done", async (id: string) => {
      try {
        // 传输成功
        await this.transfers.update(
          { id },
          { $set: { status: TransferStatus.done } },
          {}
        );
      } catch (e) {
        this.logger.error(e);
      }
    });

    emitter.on("transfer-failed", async (id: string) => {
      try {
        // 传输失败
        await this.transfers.update(
          { id },
          { $set: { status: TransferStatus.failed } },
          {}
        );
      } catch (e) {
        this.logger.error("传输失败：", e);
      }
    });

    emitter.on("transfer-finish", () => {
      if (this.mainWindow && configStore.get("transferDoneTip")) {
        this.mainWindow.webContents.send("play-finish");
      }
    });
  }
}
