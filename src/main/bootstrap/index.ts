import { ipcMain } from "electron";
import path from "path";
import uuid from "uuid/v4";
import { VFile } from "../../MainWindow/lib/vdir";
import { CallbackFunc } from "../services/types";
import { TaskRunner } from "../helper/tasks";
import { TaskType, TransferStatus, TransferStore } from "../types";
import { insertTransfer } from "../store/transfers";
import events from "../helper/events";
import { fattenFileList } from "../helper/utils";
import { uploadFile } from "./handler";
import AppInstance from "../instance";
import { downloadDir } from "../helper/dir";
import App from "../app";

const taskRunner = new TaskRunner(5, true);

// todo: transfers 本地文件 加密
export default async function bootstrap(app: App) {
  app.init();

  events.on("done", (id: string) => {
    // todo：文件下载完成
    // transfers.update({ id }, { $set: { status: TransferStatus.done } });
  });

  events.on("failed", (id: string) => {
    // todo: 文件下载失败
    // transfers.update({ id }, { $set: { status: TransferStatus.failed } });
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

  ipcMain.on("req:file:download", async (event, item: VFile) => {
    const instance = AppInstance.getInstance();
    const { oss } = instance;

    const remotePath = item.webkitRelativePath;
    const downloadPath = path.join(downloadDir, item.webkitRelativePath);
    const callback: CallbackFunc = (id, progress) => {
      console.log(`${id} - progress ${progress}%`);
    };
    // fixme: _id
    const id = uuid();
    // todo：换成class
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
      const instance = AppInstance.getInstance();
      const { oss } = instance;
      const baseDir = path.dirname(fileList[0]);
      const list = fattenFileList(fileList);
      list.forEach(filepath => {
        const callback: CallbackFunc = (id, progress) => {
          console.log(`${id} - progress ${progress}%`);
        };
        uploadFile(oss, remoteDir, baseDir, filepath, taskRunner, callback);
      });
    }
  );

  ipcMain.on("close-main-window", () => app.mainWindow.close());
  ipcMain.on("minimize-main-window", () => app.mainWindow.minimize());
  ipcMain.on("maximize-main-window", () => app.mainWindow.maximize());
}
