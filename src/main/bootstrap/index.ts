import { app, ipcMain } from "electron";
import path from "path";
import uuid from "uuid/v1";
import { Ffile } from "../../MainWindow/lib/vdir";
import services from "../services";
import { CallbackFunc } from "../services/types";
import { TaskRunner } from "../helper/tasks";
import { OssType, TaskType, TransferStatus } from "../types";
import transfers from "../store/transfers";
import events from "../helper/events";
import { initConfig } from "./config";
import { initApp } from "./apps";
import { getApps } from "../store/apps";

const taskRunner = new TaskRunner(5, true);

// todo: transfers 加密
export default async function index() {
  // 获取当前的app
  const config = await initConfig();
  const currentAppId = config.currentApp;
  if (!currentAppId) {
    console.log("还没有 app ！");
  } else {
    const a = await initApp(currentAppId);
  }

  const factory = services.create;
  const ak = "aKFa7HTRldSWSXpd3nUECT-M4lnGpTHVjKhHsWHD";
  const sk = "7MODMEi2H4yNnHmeeLUG8OReMtcDCpuXHTIUlYtL";
  const qiniu = factory(OssType.qiniu, ak, sk);
  qiniu.setBucket("downloads");

  events.on("done", (id: string) => {
    transfers.update({ id }, { $set: { status: TransferStatus.done } });
  });

  events.on("failed", (id: string) => {
    transfers.update({ id }, { $set: { status: TransferStatus.failed } });
  });

  ipcMain.on("get-buckets-request", event => {
    qiniu
      .getBucketList()
      .then(buckets => {
        event.reply("get-buckets-response", buckets);
      })
      .catch(err => {
        console.log(err.message);
      });
  });

  ipcMain.on("get-files-request", (event, bucketName: string) => {
    qiniu.setBucket(bucketName);
    qiniu
      .getBucketFiles()
      .then(files => {
        event.reply("get-files-response", files);
      })
      .catch(err => {
        console.log(err.message);
      });
  });

  ipcMain.on("req:file:download", async (event, bucketName, item: Ffile) => {
    const remotePath = item.webkitRelativePath;
    const downloadDir = app.getPath("downloads");
    const downloadPath = path.join(downloadDir, item.webkitRelativePath);
    const callback: CallbackFunc = (id, progress) => {
      console.log("id: ", id);
      console.log("progress: ", progress);
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
    transfers.insert(newDoc, (err, document) => {
      // 添加任务，自动执行
      taskRunner.addTask<any>({
        ...document,
        result: qiniu.downloadFile(id, remotePath, downloadPath, callback)
      });
    });
  });

  ipcMain.on(
    "req:file:upload",
    (event, bucket: string, remoteDir: string, filepath: string) => {
      const filename = path.basename(filepath);
      const remotePath =
        remoteDir === "/" ? filename : `${remoteDir}${filename}`;
      const callback: CallbackFunc = (id, progress) => {
        console.log("id: ", id);
        console.log("progress: ", progress);
      };
      const id = uuid();
      const newDoc = {
        id,
        name: filename,
        date: new Date().getTime(),
        type: TaskType.upload,
        size: 0,
        status: TransferStatus.default
      };
      // 存储下载信息
      transfers.insert(newDoc, (err, document) => {
        // 添加任务，自动执行
        taskRunner.addTask<any>({
          ...document,
          result: qiniu.uploadFile(remotePath, filepath, callback)
        });
      });
    }
  );

  ipcMain.on("req:file:delete", (event, bucketName: string, item: Ffile) => {
    const remotePath = item.webkitRelativePath;
    qiniu
      .deleteFile(remotePath)
      .then(res => {
        console.log("delete done!", res);
      })
      .catch(err => {
        console.log(err.message);
      });
  });

  ipcMain.on("transfers", event => {
    transfers.find({ status: TransferStatus.done }, (err, documents) => {
      if (err) throw new Error("查询出错");
      event.reply("transfers-reply", documents);
    });
  });

  ipcMain.on("transmitting", event => {
    transfers.find(
      { $not: { status: TransferStatus.done } },
      (err, documents) => {
        if (err) throw new Error("查询出错");
        event.reply("transmitting-reply", documents);
      }
    );
  });

  ipcMain.on("getApps", event => {
    getApps().then(apps => event.reply("appsRep", apps));
  });
}
