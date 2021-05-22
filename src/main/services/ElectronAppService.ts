import {
  app,
  BrowserWindow,
  clipboard,
  ipcMain,
  Menu,
  MenuItemConstructorOptions,
  nativeImage,
  protocol,
  screen,
  Tray,
} from "electron";
import { resolve } from "path";
import { inject, injectable, named } from "inversify";
import { is } from "electron-util";
import TrayIcon from "../tray-icon.png";
import { configStore } from "../helper/config";
import { IApp, ILogger, IOssService, IStore } from "../interface";
import SERVICE_IDENTIFIER from "../constants/identifiers";
import IpcChannelsService from "./IpcChannelsService";
import { checkDirExist, emitter, fail, mkdir, success } from "../helper/utils";
import TAG from "../constants/tags";
import { FlowWindowStyle } from "types/enum";

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

  init() {
    // 初始化 app
    this.logger.info("开始初始化软件");

    protocol.registerSchemesAsPrivileged([
      { scheme: "oss-client", privileges: { secure: true, standard: true } },
    ]);

    app.on("ready", async () => {
      protocol.registerFileProtocol("oss-client", (request, callback) => {
        const url = request.url.substr(13);
        callback({ path: resolve(__dirname, "../", url) });
      });

      // 检查下载目录
      const downloadIsDir = await checkDirExist(configStore.get("downloadDir"));
      if (!downloadIsDir) await mkdir(configStore.get("downloadDir"));
      this.logger.info("初始化软件完成，开始初始化窗口以及托盘图标");
      // 初始化 托盘图标
      const iconPath = resolve(__dirname, TrayIcon);
      const icon = nativeImage.createFromPath(iconPath);
      this.appTray = new Tray(icon);

      let menuTemplate: MenuItemConstructorOptions[] = [
        {
          label: "显示悬浮窗",
          visible: is.windows,
          type: "checkbox",
          checked: configStore.get("showFloatWindow"),
          click: (item) => {
            if (this.floatWindow) {
              configStore.set("showFloatWindow", item.checked);
              if (item.checked) {
                this.floatWindow.show();
              } else {
                this.floatWindow.hide();
              }
            }
          },
        },
        {
          label: "设置",
          click: () => {
            if (this.mainWindow) {
              this.mainWindow.show();
              this.mainWindow.webContents.send("to-setting");
            }
          },
        },
      ];
      if (is.macos) {
        const recentListStore = await this.transfers.find({});
        const recentList: MenuItemConstructorOptions[] =
          recentListStore.length > 0
            ? recentListStore.splice(0, 5).map((i) => ({
                label: i.name,
                click: () => {
                  if (configStore.get("markdown")) {
                    clipboard.write({
                      text: `![${i.name}](图片链接 "http://${i.name}")`,
                    });
                  } else {
                    clipboard.write({ text: i.name });
                  }
                },
              }))
            : [
                {
                  label: "暂无最近使用",
                  enabled: false,
                },
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
            },
          },
        ]);
      }
      menuTemplate = menuTemplate.concat([
        { type: "separator" },
        {
          label: "关闭程序",
          click() {
            app.quit();
          },
        },
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
          devTools: process.env.NODE_ENV === "development",
          preload: resolve(__dirname, "../preload/index.js"),
        },
        titleBarStyle: "hiddenInset",
        show: false,
      });
      const mainWindowUrl = is.development
        ? "http://localhost:3000/"
        : "oss-client://electron/main-window.html";
      this.mainWindow.loadURL(mainWindowUrl).then((r) => r);
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
      if (is.windows) {
        this.floatWindow = new BrowserWindow({
          transparent: true,
          frame: false,
          webPreferences: {
            nodeIntegration: true,
            devTools: is.development,
            preload: resolve(__dirname, "../preload/index.js"),
          },
          height: 0,
          width: 0,
          alwaysOnTop: true,
          resizable: false,
          type: "toolbar",
          show: false,
        });
        // 开始加载悬浮窗口的静态资源
        const floatWindowUrl = is.development
          ? "http://localhost:3000/float"
          : "oss-client://electron/float-window.html";
        await this.floatWindow.loadURL(floatWindowUrl);
        // 设置悬浮窗的样式
        const style = configStore.get("floatWindowStyle");
        if (style === FlowWindowStyle.circle) {
          // 圆形的
          this.floatWindow.setContentSize(67, 67);
        } else {
          // 椭圆形
          this.floatWindow.setContentSize(87, 30);
        }
        const size = screen.getPrimaryDisplay().workAreaSize;
        const winSize = this.floatWindow.getSize();
        this.floatWindow.setPosition(size.width - winSize[0] - 100, 100);
        this.floatWindow.on("closed", () => {
          if (this.floatWindow) this.floatWindow = null;
        });
        this.floatWindow.once("ready-to-show", () => {
          if (this.floatWindow && configStore.get("showFloatWindow"))
            this.floatWindow.show();
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
          devTools: false,
          preload: resolve(__dirname, "../preload/index.js"),
        },
        modal: true,
        show: false,
      });
      const alertWindowUrl = is.development
        ? "http://localhost:3000/alert"
        : "oss-client://electron/alert-window.html";
      await this.alertWindow.loadURL(alertWindowUrl);
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
          devTools: false,
          preload: resolve(__dirname, "../preload/index.js"),
        },
        modal: true,
        show: false,
      });
      const confirmWindowUrl = is.development
        ? "http://localhost:3000/confirm"
        : "oss-client://electron/confirm-window.html";
      await this.confirmWindow.loadURL(confirmWindowUrl);
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
      if (is.macos) {
        app.quit();
      }
    });

    this.logger.info("初始化窗口成功，开始初始化ipc通道");
    // --------------------------------------------------------------
    // |                                                            |
    // |                   开始注册 IPC 通道                          |
    // |                                                            |
    // --------------------------------------------------------------
    ipcMain.handle("update-app", async (event, params) => {
      try {
        await this.appChannels.updateApp(params);
        return success(true);
      } catch (e) {
        this.logger.error("修改 app 出错：", e);
        return fail(1, e.message);
      }
    });
    ipcMain.handle("delete-app", async (event, id) => {
      if (!id) return fail(1, "id 不能为空");
      try {
        await this.appChannels.deleteApp(id);
        return success(true);
      } catch (e) {
        return fail(1, e.message);
      }
    });
    ipcMain.handle("get-apps", async (event) => {
      try {
        const apps = await this.appChannels.getApps();
        return success(apps);
      } catch (e) {
        return fail(1, e.message);
      }
    });
    ipcMain.handle("init-app", async (event, params) => {
      try {
        const appStore = await this.appChannels.initApp(params);
        return success(appStore);
      } catch (e) {
        return fail(1, e.message);
      }
    });
    ipcMain.handle("add-app", async (event, params) => {
      try {
        // 开始执行添加 app 方法
        const data = await this.appChannels.addApp(params);
        return success(data);
      } catch (e) {
        return fail(1, e.message);
      }
    });
    ipcMain.handle("clear-transfer-done-list", async (event, params) => {
      try {
        await this.appChannels.removeTransfers(params);
        return success(true);
      } catch (e) {
        return fail(1, e.message);
      }
    });
    ipcMain.handle("get-transfer", async (event, params) => {
      try {
        const transfers = await this.appChannels.getTransfers(params);
        return success(transfers);
      } catch (e) {
        return fail(1, e.message);
      }
    });
    ipcMain.handle("get-buckets", async (event, params) => {
      try {
        const buckets = await this.appChannels.getBuckets(params);
        return success(buckets);
      } catch (err) {
        return fail(1, "获取 buckets 失败，请检查 ak，sk 是否匹配！");
      }
    });
    ipcMain.handle("get-config", async (event) => {
      try {
        const data = await this.appChannels.getConfig();
        return success(data);
      } catch (e) {
        return fail(1, e.message);
      }
    });
    ipcMain.handle("switch-bucket", async (event, params) => {
      const { bucketName } = params;
      if (typeof bucketName !== "string" || bucketName === "")
        return fail(1, "参数错误");
      try {
        const obj = await this.appChannels.switchBucket(bucketName);
        return success(obj);
      } catch (e) {
        this.logger.error("切换 bucket 时出错", e);
        return fail(1, e.message);
      }
    });
    ipcMain.handle(
      "refresh-bucket",
      async (event, { force }: { force?: boolean }) => {
        try {
          const object = await this.appChannels.refreshBucket(!!force);
          return success(object);
        } catch (e) {
          this.logger.error("刷新 bucket 出错：", e);
          return fail(1, e.message);
        }
      }
    );
    ipcMain.handle("show-alert", async (event, options) => {
      if (this.alertWindow) {
        this.alertWindow.webContents.send("options", options);
      }
      const getWaitFor = () => {
        return new Promise((r) => {
          ipcMain.once("close-alert", () => {
            if (this.alertWindow) this.alertWindow.hide();
            r(true);
          });
        });
      };
      await getWaitFor();
      return success(true);
    });
    ipcMain.handle("change-setting", async (event, params) => {
      const { key, value } = params;
      console.log(params, "params");
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
        case "currentAppId":
          configStore.set(key, value);
          return success(true);
        case "uploadRename":
          configStore.set(key, value);
          return success(true);
        default:
          return fail(1, "不支持该设置");
      }
    });

    ipcMain.handle("show-confirm", async (event, options) => {
      if (this.confirmWindow) {
        // fixme: 提示音
        this.confirmWindow.webContents.send("options", options);
      }
      const getWaitFor = () => {
        return new Promise((r, reject) => {
          ipcMain.once("close-confirm", (e, flag: boolean) => {
            if (this.confirmWindow) this.confirmWindow.hide();
            if (flag) r(true);
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

    ipcMain.handle("delete-files", async (event, params) => {
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

    ipcMain.handle("download-files", async (event, params) => {
      if (!("remoteDir" in params)) return fail(1, "参数错误");
      if (!("fileList" in params)) return fail(1, "参数错误");
      const { fileList } = params;
      if (Array.isArray(fileList) && fileList.length === 0) {
        return fail(1, "参数错误");
      }
      try {
        await this.appChannels.downloadFiles(params);
        return success(true);
      } catch (e) {
        this.logger.error("上传文件时出错：", e);
        return fail(1, e.message);
      }
    });

    ipcMain.handle("upload-files", async (event, params) => {
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

    ipcMain.handle("get-url", async (event, key) => {
      if (!key) return fail(1, "参数错误");
      try {
        const url = await this.appChannels.getFileUrl(key);
        return success(url);
      } catch (e) {
        return fail(1, e.message);
      }
    });

    ipcMain.on("show-window", (event, windowName: string) => {
      switch (windowName) {
        case "alert":
          return this.alertWindow?.show();
        case "confirm":
          return this.confirmWindow?.show();
        case "main":
          return this.mainWindow?.show();
        case "float":
          return this.floatWindow?.show();
        default:
          return null;
      }
    });

    // --------------------------------------------------------------
    // |                                                            |
    // |                   软件内部事件通讯机制                        |
    // |                                                            |
    // --------------------------------------------------------------

    // 处理文件传输完成
    emitter.on("transfer-done", (id: string) => {
      this.logger.info("传输文件完成");
    });

    // 处理传输进度
    emitter.on("transfer-process", (progressList) => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send("transfer-progress", progressList);
      }
    });

    // 处理传输文件失败
    emitter.on("transfer-failed", (id: string) => {
      this.logger.error("传输文件失败");
    });

    // 处理传输完成
    emitter.on("transfer-finish", () => {
      if (this.mainWindow && configStore.get("transferDoneTip")) {
        this.mainWindow.webContents.send("transfer-finish");
      }
    });

    // 处理上传任务完成
    emitter.on("upload-finish", () => {
      if (this.mainWindow) {
        this.mainWindow.webContents.send("upload-finish");
      }
    });
  }
}
