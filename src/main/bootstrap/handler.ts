import uuid from "uuid/v1";
import { CallbackFunc, IObjectStorageService } from "../services/types";
import { TaskRunner } from "../helper/tasks";
import { TaskType, TransferStatus } from "../types";
import transfers from "../store/transfers";

export function uploadFile(
  adapter: IObjectStorageService,
  remoteDir: string,
  baseDir: string,
  filepath: string,
  taskRunner: TaskRunner,
  callback: CallbackFunc
) {
  const filename = filepath.replace(`${baseDir}/`, "");
  const remotePath = remoteDir === "/" ? filename : `${remoteDir}${filename}`;
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
      result: adapter.uploadFile(remotePath, filepath, callback)
    });
  });
}
