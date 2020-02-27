import IpcService from "./lib/service/IpcService";
import { OssType } from "../main/types";
import { AppStore } from "../main/store/apps";

const ipc = new IpcService();

export type BucketObj = {
  domains: [];
  files: [];
};

export async function switchBucket(bucketName: string): Promise<BucketObj> {
  const bucketObj = await ipc.send<BucketObj>("switch-bucket", {
    params: bucketName
  });
  return bucketObj;
}

export async function getBuckets(): Promise<string[]> {
  const bucketList = await ipc.send<string[]>("get-buckets");
  return bucketList;
}

export async function getAppsChannel(): Promise<AppStore[]> {
  const apps = await ipc.send<AppStore[]>("get-apps");
  return apps;
}

export async function addApp(
  name: string,
  type: OssType,
  ak: string,
  sk: string
): Promise<AppStore> {
  const app = await ipc.send<AppStore>("add-app", {
    params: { name, type, ak, sk }
  });
  return app;
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
