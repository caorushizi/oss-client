import IpcService from "../lib/service/IpcService";
import { OssType, TransferStore } from "../../main/types";
import { AppStore } from "../../main/store/apps";

const ipc = new IpcService();

export type BucketObj = {
  domains: [];
  files: [];
};

export function switchBucket(bucketName: string): Promise<BucketObj> {
  return ipc.send<BucketObj>("switch-bucket", {
    params: bucketName
  });
}

export function getBuckets(): Promise<string[]> {
  return ipc.send<string[]>("get-buckets");
}

export function getAppsChannel(): Promise<AppStore[]> {
  return ipc.send<AppStore[]>("get-apps");
}

export function initOss(id?: string): Promise<void> {
  return ipc.send("init-app", { params: { id } });
}

export function getTransfers(): Promise<TransferStore[]> {
  return ipc.send("get-transfer");
}

export function addApp(
  name: string,
  type: OssType,
  ak: string,
  sk: string
): Promise<AppStore> {
  return ipc.send<AppStore>("add-app", {
    params: { name, type, ak, sk }
  });
}

export function updateApp(app: AppStore) {
  return ipc.send<void>("update-app", {
    params: app
  });
}

export function closeMainApp() {
  ipc.emit("close-main-window");
}

export function minimizeMainWindow() {
  ipc.emit("minimize-main-window");
}

export function maximizeMainWindow() {
  ipc.emit("maximize-main-window");
}
