import uuid from "uuid/v4";
import { CallbackFunc, IObjectStorageService } from "../services/types";
import { TaskRunner } from "../helper/tasks";
import { TaskType, TransferStatus } from "../types";
import { insertTransfer } from "../store/transfers";

export async function uploadFile(
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
  const document = await insertTransfer(newDoc);
  // 添加任务，自动执行
  taskRunner.addTask<any>({
    ...document,
    result: adapter.uploadFile(id, remotePath, filepath, callback)
  });
}
