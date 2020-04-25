import { inject, injectable, named } from "inversify";
import { ipcMain } from "electron";
import path from "path";
import uuid from "uuid/v4";
import {
  IApp,
  IBootstrap,
  ILogger,
  IStore,
  ITaskRunner,
  IOSS,
  IOssService
} from "../interface";
import SERVICE_IDENTIFIER from "../constants/identifiers";
import events from "../helper/events";
import { configStore } from "../helper/config";
import { TaskType, TransferStatus, TransferStore } from "../types";
import VFile from "../../MainWindow/lib/vdir/VFile";
import { fattenFileList } from "../helper/utils";
import { checkDirExist, mkdir } from "../helper/fs";
import TAG from "../constants/tags";

@injectable()
export default class SimpleBootService implements IBootstrap {
  // @ts-ignore
  @inject(SERVICE_IDENTIFIER.TASK_RUNNER) public taskRunner: ITaskRunner;

  // @ts-ignore
  @inject(SERVICE_IDENTIFIER.ELECTRON_APP) public app: IApp;

  @inject(SERVICE_IDENTIFIER.STORE)
  @named(TAG.TRANSFER_STORE)
  // @ts-ignore
  private transfers: IStore<TransferStore>;

  // @ts-ignore
  @inject(SERVICE_IDENTIFIER.LOGGER) private logger: ILogger;

  // @ts-ignore
  @inject(SERVICE_IDENTIFIER.OSS) private oss: IOssService;

  initConfig = async (): Promise<void> => {
    // 检查下载目录
    const downloadIsDir = await checkDirExist(configStore.get("downloadDir"));
    if (!downloadIsDir) await mkdir(configStore.get("downloadDir"));
    // 检查缓存目录
    const cacheIsDir = await checkDirExist(configStore.get("cacheDir"));
    if (!cacheIsDir) await mkdir(configStore.get("cacheDir"));
  };

  start(): void {
    this.app.init();
    this.initConfig().then();

    events.on("done", async (id: string) => {
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

    events.on("failed", async (id: string) => {
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

    events.on("finish", () => {
      if (this.app.mainWindow && configStore.get("transferDoneTip")) {
        this.app.mainWindow.webContents.send("play-finish");
      }
    });

    ipcMain.on("get-buckets-request", async event => {
      const instance = this.oss.getService();
      const buckets = await instance.getBucketList();
      event.reply("get-buckets-response", buckets);
    });

    ipcMain.on("get-files-request", async (event, bucketName: string) => {
      const instance = this.oss.getService();
      instance.setBucket(bucketName);
      const files = await instance.getBucketFiles();
      event.reply("get-files-response", files);
    });

    ipcMain.on("req:file:download", async (event, item: BucketItem) => {
      const instance = this.oss.getService();
      const remotePath = item.webkitRelativePath;
      const customDownloadDir = configStore.get("downloadDir");
      const downloadPath = path.join(
        customDownloadDir,
        item.webkitRelativePath
      );
      const callback = (id: string, progress: string) => {
        console.log(`${id} - progress ${progress}%`);
      };
      const id = uuid();
      const newDoc = {
        id,
        name: item.name,
        date: new Date().getTime(),
        type: TaskType.download,
        size: item.size,
        status: TransferStatus.default
      };
      // 存储下载信息
      const document = await this.transfers.insert(newDoc);
      // 添加任务，自动执行
      this.taskRunner.addTask<TransferStore>({
        ...document,
        result: instance.downloadFile(id, remotePath, downloadPath, callback)
      });
    });

    ipcMain.on(
      "req:file:upload",
      (event, remoteDir: string, filepath: string) => {
        const instance = this.oss.getService();
        const baseDir = path.dirname(filepath);
        const callback = (id: string, progress: string) => {
          console.log(`${id} - progress ${progress}%`);
        };
        this.uploadFile(instance, remoteDir, baseDir, filepath, callback);
      }
    );

    ipcMain.on("delete-file", async (event, { params }: { params: VFile }) => {
      const instance = this.oss.getService();
      const remotePath = params.webkitRelativePath;
      await instance.deleteFile(remotePath);
    });

    ipcMain.on(
      "drop-files",
      async (event, remoteDir: string, fileList: string[]) => {
        if (Array.isArray(fileList) && fileList.length === 0) return;
        const instance = this.oss.getService();
        const baseDir = path.dirname(fileList[0]);
        const filepathList = fattenFileList(fileList);
        filepathList.forEach(filepath => {
          const callback = (id: string, progress: string) => {
            console.log(`${id} - progress ${progress}%`);
          };
          this.uploadFile(instance, remoteDir, baseDir, filepath, callback);
        });
      }
    );

    ipcMain.on("close-main-window", () => {
      if (this.app.mainWindow) {
        this.app.mainWindow.hide();
      }
    });
    ipcMain.on("minimize-main-window", () => {
      if (this.app.mainWindow) {
        this.app.mainWindow.minimize();
      }
    });
    ipcMain.on("maximize-main-window", () => {
      if (this.app.mainWindow) {
        if (this.app.mainWindow.isMaximized()) {
          this.app.mainWindow.unmaximize();
        } else {
          this.app.mainWindow.maximize();
        }
      }
    });
    ipcMain.on("change-theme", (e, { params }) => {
      if (this.app.floatWindow) {
        this.app.floatWindow.webContents.send("switch-shape", params);
      }
    });

    ipcMain.on("change-use-https", (e, { params }) => {
      configStore.set("useHttps", params);
    });

    ipcMain.on("change-direct-delete", (e, { params }) => {
      configStore.set("deleteShowDialog", params);
    });

    ipcMain.on("change-upload-override", (e, { params }) => {
      configStore.set("uploadOverwrite", params);
    });

    ipcMain.on("change-markdown", (e, { params }) => {
      configStore.set("markdown", params);
    });

    ipcMain.on("change-transfer-done-tip", (e, { params }) => {
      configStore.set("transferDoneTip", params);
    });

    ipcMain.on("change-download-dir", (e, { params }) => {
      configStore.set("downloadDir", params);
    });
  }

  uploadFile(
    adapter: IOSS,
    remoteDir: string,
    baseDir: string,
    filepath: string,
    callback: (id: string, process: string) => void
  ) {
    const relativePath = path.relative(baseDir, filepath);
    let remotePath = path.join(remoteDir, relativePath);
    remotePath = remotePath.replace(/\\/, "/");

    const id = uuid();
    const newDoc = {
      id,
      name: path.basename(remotePath),
      date: Date.now(),
      type: TaskType.upload,
      size: 0,
      status: TransferStatus.default
    };
    // 存储下载信息
    const document = this.transfers
      .insert(newDoc)
      .then((transfers: TransferStore) => {
        // 添加任务，自动执行
        this.taskRunner.addTask<any>({
          ...transfers,
          result: adapter.uploadFile(id, remotePath, filepath, callback)
        });
      });
  }
}
