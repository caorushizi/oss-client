import IpcService from "./lib/service/IpcService";

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

export function closeMainApp() {
  ipc.emit("close-main-window");
}

export function minimizeMainWindow() {
  ipc.emit("minimize-main-window");
}

export function maximizeMainWindow() {
  ipc.emit("maximize-main-window");
}
