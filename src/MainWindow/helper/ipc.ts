import uuidV1 from "uuid/v1";
import { ipcRenderer, IpcRendererEvent } from "electron";
import {
  ConfigStore,
  FlowWindowStyle,
  TransferStore,
  AppStore,
  TransferStatus,
  OssType
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

export function switchBucket(bucketName: string): Promise<BucketObj> {
  return send<BucketObj>("switch-bucket", { bucketName });
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
  console.log("renderer ipc get buckets: ", config);
  const { code, msg, data } = await send<IpcResponse>("get-buckets", config);
  if (code !== 0) {
    throw new Error(msg);
  }
  return data;
}

export function getAppsChannel(): Promise<AppStore[]> {
  return send<AppStore[]>("get-apps");
}

export function initOss(id?: string): Promise<AppStore> {
  return send("init-app", { id });
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

export function updateApp(app: AppStore) {
  return send<void>("update-app", app);
}

export function deleteApp(app: AppStore) {
  return send<void>("delete-app", app);
}

export function clearTransferDoneList() {
  return send<void>("clear-transfer-done-list", TransferStatus.done);
}

export function closeMainApp() {
  ipcRenderer.send("close-main-window");
}

export function minimizeMainWindow() {
  ipcRenderer.send("minimize-main-window");
}

export function maximizeMainWindow() {
  ipcRenderer.send("maximize-main-window");
}

export function changeFloatWindowShape(shape: FlowWindowStyle) {
  ipcRenderer.send("change-theme", { params: shape });
}

export function changeUseHttps(useHttps: boolean) {
  ipcRenderer.send("change-use-https", { params: useHttps });
}

export function changeDirectDelete(directDelete: boolean) {
  ipcRenderer.send("change-direct-delete", { params: directDelete });
}

export function changeUploadOverride(uploadOverride: boolean) {
  ipcRenderer.send("change-upload-override", { params: uploadOverride });
}

export function changeDownloadDir(downloadDir: string) {
  ipcRenderer.send("change-download-dir", { params: downloadDir });
}

export function changeMarkdown(isMarkdown: boolean) {
  ipcRenderer.send("change-markdown", { params: isMarkdown });
}

export function changeDownloadTip(transferDoneTip: boolean) {
  ipcRenderer.send("change-transfer-done-tip", { params: transferDoneTip });
}

export function deleteFile(vFile: VFile) {
  ipcRenderer.send("delete-file", { params: vFile });
}

export function getConfig() {
  return send<ConfigStore>("get-config");
}
