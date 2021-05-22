import { AppStore, ConfigStore, TransferStore, VFile } from "types/common";
import { OssType, TransferStatus } from "types/enum";
import { ipcRenderer } from "electron";

const invoke = async (eventName: string, args: any = undefined) => {
  const { code, msg, data } = await ipcRenderer.invoke(eventName, args);
  if (String(code) !== "0") {
    throw new Error(msg);
  }
  return data;
};

type BucketMeta = {
  domains: string[];
  files: VFile[];
  type: OssType;
};

export async function switchBucket(bucketName: string): Promise<BucketMeta> {
  return invoke("switch-bucket", { bucketName });
}

export function refreshBucket(force?: boolean): Promise<BucketMeta> {
  return invoke("refresh-bucket", { force });
}

export async function getBuckets(config?: {
  type: OssType;
  ak: string;
  sk: string;
}): Promise<string[]> {
  return invoke("get-buckets", config);
}

export async function getAppsChannel(): Promise<AppStore[]> {
  return invoke("get-apps");
}

export async function initOss(id?: string): Promise<AppStore> {
  return invoke("init-app", { id });
}

export async function getTransfers(query: any): Promise<TransferStore[]> {
  return invoke("get-transfer", query);
}

export async function addApp(
  name: string,
  type: OssType,
  ak: string,
  sk: string
): Promise<AppStore> {
  const app = { name, type, ak, sk };
  return invoke("add-app", app);
}

export function updateApp(app: AppStore) {
  return invoke("update-app", app);
}

export function deleteApp(id?: string) {
  return invoke("delete-app", id);
}

export function clearTransferDoneList() {
  return invoke("clear-transfer-done-list", TransferStatus.done);
}

export function changeSetting(key: string, value: any) {
  console.log(123123, { key, value });
  return invoke("change-setting", { key, value });
}

export function deleteFiles(paths: string[]) {
  return invoke("delete-files", { paths });
}

export function getConfig(): Promise<ConfigStore> {
  return invoke("get-config");
}

export function showAlert(options?: { title?: string; message?: string }) {
  return invoke("show-alert", options);
}

export function showConfirm(options?: { title?: string; message?: string }) {
  return invoke("show-confirm", options);
}

export function uploadFiles(options: {
  remoteDir: string;
  fileList: string[];
  flag?: boolean; // 是不是悬浮窗上传
}) {
  return invoke("upload-files", options);
}

export function downloadFiles(options: {
  remoteDir: string;
  fileList: VFile[];
}) {
  return invoke("download-files", options);
}

export function getFileUrl(key: string) {
  return invoke("get-url", key);
}

export const showWindow = (windowName: string): void =>
  ipcRenderer.send("showWindow", windowName);
