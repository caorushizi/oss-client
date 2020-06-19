import uuidV1 from "uuid/v1";
import { ipcRenderer, IpcRendererEvent } from "electron";
import {
  AppStore,
  ConfigStore,
  OssType,
  TransferStatus,
  TransferStore
} from "../../main/types";
import VFile from "../lib/vdir/VFile";

function send<T>(eventName: string, options = {}) {
  const data = options;
  const id = uuidV1();
  const responseEvent = `${eventName}_res_${id}`;

  return new Promise<T>((resolve, reject) => {
    // 这里使用 once 监听，响应到达后就销毁
    ipcRenderer.once(
      responseEvent,
      (event: IpcRendererEvent, response: { code: number; data: any }) => {
        if (response.code === 200) {
          resolve(response.data);
        } else {
          reject(response.data);
        }
      }
    );
    // 监听建立之后再发送事件，稳一点
    ipcRenderer.send(eventName, { id, data });
  });
}

export type BucketObj = {
  domains: [];
  files: [];
};

export async function switchBucket(bucketName: string): Promise<BucketObj> {
  const params = { bucketName };
  const { code, msg, data } = await send<IpcResponse>("switch-bucket", params);
  if (code !== 0) {
    throw new Error(msg);
  }
  return data;
}

/**
 * 获取云存储的 buckets
 * @param config （可选）如果传了返回当前配置的 buckets， 如果不是测返回当前上下文中配置的 buckets
 */
export async function getBuckets(config?: {
  type: OssType;
  ak: string;
  sk: string;
}): Promise<string[]> {
  const { code, msg, data } = await send<IpcResponse>("get-buckets", config);
  if (code !== 0) {
    throw new Error(msg);
  }
  return data;
}

export async function getAppsChannel(): Promise<AppStore[]> {
  const { code, msg, data } = await send<IpcResponse>("get-apps");
  if (code !== 0) {
    throw new Error(msg);
  }
  return data;
}

export async function initOss(id?: string): Promise<AppStore> {
  const { code, msg, data } = await send<IpcResponse>("init-app", { id });
  if (code !== 0) {
    throw new Error(msg);
  }
  return data;
}

export function getTransfers(query: any): Promise<TransferStore[]> {
  return send("get-transfer", query);
}

export async function addApp(
  name: string,
  type: OssType,
  ak: string,
  sk: string
): Promise<AppStore> {
  const app = { name, type, ak, sk };
  const { code, msg, data } = await send<IpcResponse>("add-app", app);
  if (code !== 0) {
    throw new Error(msg);
  }
  return data;
}

export async function updateApp(app: AppStore) {
  const { code, msg, data } = await send<IpcResponse>("update-app", app);
  if (code !== 0) {
    throw new Error(msg);
  }
  return data;
}

export async function deleteApp(id?: string) {
  const { code, msg, data } = await send<IpcResponse>("delete-app", id);
  if (code === 0) {
    return data;
  }
  throw new Error(msg);
}

export function clearTransferDoneList() {
  return send<void>("clear-transfer-done-list", TransferStatus.done);
}

export async function changeSetting(key: string, value: any) {
  const { code, data, msg } = await send<IpcResponse>("change-setting", {
    key,
    value
  });
  if (code !== 0) {
    throw new Error(msg);
  }
  return data;
}

export function deleteFile(vFile: VFile) {
  return send("delete-file", { file: vFile });
}

export function getConfig() {
  return send<ConfigStore>("get-config");
}

export async function showAlert(options?: {
  title?: string;
  message?: string;
}) {
  const { code, msg, data } = await send<IpcResponse>("show-alert", options);
  if (code === 0) {
    return data;
  }
  throw new Error(msg);
}

export async function showConfirm(options?: {
  title?: string;
  message?: string;
}) {
  const { code, msg, data } = await send<IpcResponse>("show-confirm", options);
  if (code === 0) {
    return data;
  }
  throw new Error(msg);
}

export async function uploadFile(options: {
  remoteDir: string;
  filepath: string;
}) {
  const { code, msg, data } = await send<IpcResponse>("upload-file", options);
  if (code === 0) {
    return data;
  }
  throw new Error(msg);
}

export async function uploadFiles(options: {
  remoteDir: string;
  fileList: string[];
}) {
  const { code, msg, data } = await send<IpcResponse>("upload-files", options);
  if (code === 0) {
    return data;
  }
  throw new Error(msg);
}

export async function downloadFile(item: VFile) {
  const { code, msg, data } = await send<IpcResponse>("upload-files", item);
  if (code === 0) {
    return data;
  }
  throw new Error(msg);
}
