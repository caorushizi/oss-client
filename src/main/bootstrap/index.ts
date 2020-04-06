import { ipcMain } from "electron";
import path from "path";
import uuid from "uuid/v4";
import { CallbackFunc } from "../services/types";
import { TaskRunner } from "../helper/tasks";
import { TaskType, TransferStatus, TransferStore } from "../types";
import {
  insertTransfer,
  transferDone,
  transferFailed
} from "../store/transfers";
import events from "../helper/events";
import { fattenFileList } from "../helper/utils";
import { uploadFile } from "./handler";
import AppInstance from "../instance";
import { downloadDir } from "../helper/dir";
import App from "../app";
import { initConfig } from "./config";
import VFile from "../../MainWindow/lib/vdir/VFile";
import { configStore } from "../store/config";
import { errorLog, infoLog } from "../logger";

const taskRunner = new TaskRunner(5, true);

export default async function bootstrap(app: App) {
  app.init();
  await initConfig();

  events.on("done", (id: string) => {
    transferDone(id)
      .then(() => {
        infoLog("传输已成功");
      })
      .catch(err => {
        errorLog("传输失败：", err);
      });
  });

  events.on("failed", (id: string) => {
    transferFailed(id)
      .then(() => {
        infoLog("传输已成功");
      })
      .catch(err => {
        errorLog("传输失败：", err);
      });
  });

  ipcMain.on("get-buckets-request", async event => {
    const instance = AppInstance.getInstance();
    const { oss } = instance;
    const buckets = await oss.getBucketList();
    event.reply("get-buckets-response", buckets);
  });

  ipcMain.on("get-files-request", async (event, bucketName: string) => {
    const instance = AppInstance.getInstance();
    const { oss } = instance;
    oss.setBucket(bucketName);
    const files = await oss.getBucketFiles();
    event.reply("get-files-response", files);
  });

  ipcMain.on("req:file:download", async (event, item: BucketItem) => {
    const instance = AppInstance.getInstance();
    const { oss } = instance;

    const remotePath = item.webkitRelativePath;
    const downloadPath = path.join(downloadDir, item.webkitRelativePath);
    const callback: CallbackFunc = (id, progress) => {
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
    const document = await insertTransfer(newDoc);
    // 添加任务，自动执行
    taskRunner.addTask<TransferStore>({
      ...document,
      result: oss.downloadFile(id, remotePath, downloadPath, callback)
    });
  });

  ipcMain.on(
    "req:file:upload",
    (event, remoteDir: string, filepath: string) => {
      const instance = AppInstance.getInstance();
      const { oss } = instance;

      const baseDir = path.dirname(filepath);
      const callback: CallbackFunc = (id, progress) => {
        console.log(`${id} - progress ${progress}%`);
      };
      uploadFile(oss, remoteDir, baseDir, filepath, taskRunner, callback);
    }
  );

  ipcMain.on("req:file:delete", async (event, item: VFile) => {
    const instance = AppInstance.getInstance();
    const { oss } = instance;
    const remotePath = item.webkitRelativePath;
    await oss.deleteFile(remotePath);
  });

  ipcMain.on(
    "drop-files",
    async (event, remoteDir: string, fileList: string[]) => {
      if (Array.isArray(fileList) && fileList.length === 0) return;
      const instance = AppInstance.getInstance();
      const { oss } = instance;
      const baseDir = path.dirname(fileList[0]);
      const filepathList = fattenFileList(fileList);
      filepathList.forEach(filepath => {
        const callback: CallbackFunc = (id, progress) => {
          console.log(`${id} - progress ${progress}%`);
        };
        uploadFile(oss, remoteDir, baseDir, filepath, taskRunner, callback);
      });
    }
  );

  ipcMain.on("close-main-window", () => {
    if (app.mainWindow) app.mainWindow.hide();
  });
  ipcMain.on("minimize-main-window", () => {
    if (app.mainWindow) app.mainWindow.minimize();
  });
  ipcMain.on("maximize-main-window", () => {
    if (app.mainWindow) {
      if (app.mainWindow.isMaximized()) {
        app.mainWindow.unmaximize();
      } else {
        app.mainWindow.maximize();
      }
    }
  });
  ipcMain.on("change-theme", (e, { params }) => {
    if (app.floatWindow) {
      app.floatWindow.webContents.send("switch-shape", params);
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

  ipcMain.on("change-download-dir", (e, { params }) => {
    configStore.set("downloadDir", params);
  });
}
