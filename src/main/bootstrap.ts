import { ipcMain, app } from "electron";
import path from "path";
import services from "./services";
import { CallbackFunc, ObjectStorageServiceType } from "./services/types";

import IpcMainEvent = Electron.IpcMainEvent;

export default function bootstrap() {
  const factory = services.create;
  const ak = "aKFa7HTRldSWSXpd3nUECT-M4lnGpTHVjKhHsWHD";
  const sk = "7MODMEi2H4yNnHmeeLUG8OReMtcDCpuXHTIUlYtL";
  const qiniu = factory(ObjectStorageServiceType.Qiniu, ak, sk);
  const bucketName = "downloads";

  ipcMain.on("get-buckets-request", event => {
    qiniu.getBucketList().then(buckets => {
      event.reply("get-buckets-response", buckets);
    });
  });

  ipcMain.on("get-files-request", (event, name) => {
    qiniu.getBucketFiles(bucketName).then(files => {
      event.reply("get-files-response", files);
    });
  });

  ipcMain.on("req:file:download", (event, bucket, item) => {
    const remotePath = item.webkitRelativePath;
    const downloadDir = app.getPath("downloads");
    const downloadPath = path.join(downloadDir, item.webkitRelativePath);
    const callback: CallbackFunc = (id, progress) => {
      console.log("id: ", id);
      console.log("progress: ", progress);
    };
    qiniu
      .downloadFile(bucketName, remotePath, downloadPath, callback)
      .then((res: any) => {
        console.log("get link done!", res);
      })
      .catch((err: any) => {
        console.log("下载出错：", err);
      });
  });

  ipcMain.on(
    "req:file:upload",
    (event: IpcMainEvent, bucket: string, remoteDir: string, filepath: string) => {
      const filename = path.basename(filepath);
      const remotePath = remoteDir === "/" ? filename : `${remoteDir}${filepath}`;
      // eslint-disable-next-line no-debugger
      debugger;
      const callback: CallbackFunc = (id, progress) => {
        console.log("id: ", id);
        console.log("progress: ", progress);
      };
      qiniu.uploadFile(bucketName, remotePath, filepath, callback).then(() => {
        console.log("upload done!");
      });
    }
  );
}
