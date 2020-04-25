import uuidV1 from "uuid/v1";
import { ipcRenderer, IpcRendererEvent } from "electron";
import {
  ConfigStore,
  FlowWindowStyle,
  OssType,
  TransferStore,
  AppStore
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
  return send<BucketObj>("switch-bucket", {
    params: bucketName
  });
}

export function getBuckets(): Promise<string[]> {
  return send<string[]>("get-buckets");
}

export function getAppsChannel(): Promise<AppStore[]> {
  return send<AppStore[]>("get-apps");
}

export function initOss(id?: string): Promise<void> {
  return send("init-app", { params: { id } });
}

export function getTransfers(): Promise<TransferStore[]> {
  return send("get-transfer");
}

export function addApp(
  name: string,
  type: OssType,
  ak: string,
  sk: string
): Promise<AppStore> {
  return send<AppStore>("add-app", {
    params: { name, type, ak, sk }
  });
}

export function updateApp(app: AppStore) {
  return send<void>("update-app", {
    params: app
  });
}

export function deleteApp(app: AppStore) {
  return send<void>("delete-app", {
    params: app
  });
}

export function clearTransferDoneList() {
  return send<void>("clear-transfer-done-list");
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

export function getRecentTransferList() {
  return send<TransferStore[]>("get-recent-transfer-list");
}

export function deleteFile(vFile: VFile) {
  ipcRenderer.send("delete-file", { params: vFile });
}

export function getConfig() {
  return send<ConfigStore>("get-config");
}
