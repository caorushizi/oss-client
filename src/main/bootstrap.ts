// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcMain, app } from "electron";
import path from "path";
import services from "./services";
import { CallbackFunc, ObjectStorageServiceType } from "./services/types";
import { Item } from "../renderer/lib/vdir";

export default function bootstrap() {
  const factory = services.create;
  const ak = "aKFa7HTRldSWSXpd3nUECT-M4lnGpTHVjKhHsWHD";
  const sk = "7MODMEi2H4yNnHmeeLUG8OReMtcDCpuXHTIUlYtL";
  const qiniu = factory(ObjectStorageServiceType.Qiniu, ak, sk);
  qiniu.setBucket("downloads");

  ipcMain.on("get-buckets-request", event => {
    qiniu
      .getBucketList()
      .then(buckets => {
        event.reply("get-buckets-response", buckets);
      })
      .catch(err => {
        console.log(err);
      });
  });

  ipcMain.on("get-files-request", event => {
    qiniu
      .getBucketFiles()
      .then(files => {
        event.reply("get-files-response", files);
      })
      .catch(err => {
        console.log(err);
      });
  });

  ipcMain.on("req:file:download", (event, bucketName, item: Item) => {
    const remotePath = item.webkitRelativePath;
    const downloadDir = app.getPath("downloads");
    const downloadPath = path.join(downloadDir, item.webkitRelativePath);
    const callback: CallbackFunc = (id, progress) => {
      console.log("id: ", id);
      console.log("progress: ", progress);
    };
    qiniu
      .downloadFile(remotePath, downloadPath, callback)
      .then((res: any) => {
        console.log("get link done!", res);
      })
      .catch((err: any) => {
        console.log("下载出错：", err);
      });
  });

  ipcMain.on("req:file:upload", (event, bucket: string, remoteDir: string, filepath: string) => {
    const filename = path.basename(filepath);
    const remotePath = remoteDir === "/" ? filename : `${remoteDir}${filepath}`;
    const callback: CallbackFunc = (id, progress) => {
      console.log("id: ", id);
      console.log("progress: ", progress);
    };
    qiniu
      .uploadFile(remotePath, filepath, callback)
      .then(() => {
        console.log("upload done!");
      })
      .catch((err: Error) => {
        console.log(err);
      });
  });

  ipcMain.on("req:file:delete", (event, bucketName: string, item: Item) => {
    const remotePath = item.webkitRelativePath;
    qiniu
      .deleteFile(remotePath)
      .then(res => {
        console.log("delete done!", res);
      })
      .catch(err => {
        console.log(err);
      });
  });
}
