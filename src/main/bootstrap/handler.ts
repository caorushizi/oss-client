import uuid from "uuid/v4";
import path from "path";
import { CallbackFunc, IObjectStorageService } from "../services/types";
import { TaskRunner } from "../helper/tasks";
import { TaskType, TransferStatus, TransferStore } from "../types";
import { insertTransfer } from "../store/transfers";

export function uploadFile(
  adapter: IObjectStorageService,
  remoteDir: string,
  baseDir: string,
  filepath: string,
  taskRunner: TaskRunner,
  callback: CallbackFunc
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
  const document = insertTransfer(newDoc).then((transfers: TransferStore) => {
    // 添加任务，自动执行
    taskRunner.addTask<any>({
      ...transfers,
      result: adapter.uploadFile(id, remotePath, filepath, callback)
    });
  });
}
