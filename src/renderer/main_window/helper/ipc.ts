import uuidV1 from "uuid/v1";

const { ipcRenderer, IpcRendererEvent } = window.require("electron");

function send(eventName: string, options = {}): any {
  const data = options;
  const id = uuidV1();
  const responseEvent = `${eventName}_res_${id}`;
  return new Promise<IpcResponse>((resolve, reject) => {
    ipcRenderer.once(
      responseEvent,
      (event: IpcRendererEvent, response: { code: number; data: any }) => {
        if (response.code === 200) {
          const { code, msg, data: resData } = response.data;
          if (code !== 0) {
            reject(new Error(msg));
          }
          resolve(resData);
        } else {
          reject(response.data);
        }
      }
    );
    ipcRenderer.send(eventName, { id, data });
  });
}

type BucketMeta = {
  domains: string[];
  files: VFile[];
  type: OssType;
};

export async function switchBucket(bucketName: string): Promise<BucketMeta> {
  return send("switch-bucket", { bucketName });
}

export function refreshBucket(force?: boolean): Promise<BucketMeta> {
  return send("refresh-bucket", { force });
}

export async function getBuckets(config?: {
  type: OssType;
  ak: string;
  sk: string;
}): Promise<string[]> {
  return send("get-buckets", config);
}

export async function getAppsChannel(): Promise<AppStore[]> {
  return send("get-apps");
}

export async function initOss(id?: string): Promise<AppStore> {
  return send("init-app", { id });
}

export async function getTransfers(query: any): Promise<TransferStore[]> {
  return send("get-transfer", query);
}

export async function addApp(
  name: string,
  type: OssType,
  ak: string,
  sk: string
): Promise<AppStore> {
  const app = { name, type, ak, sk };
  return send("add-app", app);
}

export async function updateApp(app: AppStore) {
  return send("update-app", app);
}

export async function deleteApp(id?: string) {
  return send("delete-app", id);
}

export async function clearTransferDoneList() {
  return send("clear-transfer-done-list", TransferStatus.done);
}

export async function changeSetting(key: string, value: any) {
  return send("change-setting", { key, value });
}

export async function deleteFiles(paths: string[]) {
  return send("delete-files", { paths });
}

export function getConfig(): Promise<ConfigStore> {
  return send("get-config");
}

export async function showAlert(options?: {
  title?: string;
  message?: string;
}) {
  return send("show-alert", options);
}

export async function showConfirm(options?: {
  title?: string;
  message?: string;
}) {
  return send("show-confirm", options);
}

export async function uploadFiles(options: {
  remoteDir: string;
  fileList: string[];
  flag?: boolean; // 是不是悬浮窗上传
}) {
  return send("upload-files", options);
}

export async function downloadFiles(options: {
  remoteDir: string;
  fileList: VFile[];
}) {
  return send("download-files", options);
}

export async function getFileUrl(key: string) {
  return send("get-url", key);
}
