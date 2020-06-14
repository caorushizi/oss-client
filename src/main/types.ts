export enum OssType {
  qiniu,
  ali,
  tencent
}

export enum TaskType {
  download,
  upload
}

export type Task<T> = {
  id: string;
  name: string;
  size: number;
  date: number;
  type: TaskType;
  result: Promise<T>;
};

export type TransferStore = {
  id: string;
  name: string;
  size: number;
  date: number;
  type: TaskType;
  status: TransferStatus;
};

export type AppStore = {
  type: OssType;
  ak: string;
  sk: string;
  name: string;
  _id?: string;
  bucket: string;
  uploadBucket: string;
  uploadPrefix: string;
  defaultDomain: string;
};

export enum TransferStatus {
  default,
  done,
  failed
}

export enum FlowWindowStyle {
  circle,
  oval
}

export enum Theme {
  simple,
  colorful
}

export const initialConfig = {
  useHttps: false,
  deleteShowDialog: true,
  uploadOverwrite: false,
  theme: Theme.colorful,
  downloadDir: "",
  cacheDir: "",
  closeApp: false,
  transferDoneTip: true,
  markdown: true,
  showFloatWindow: true,
  floatWindowStyle: FlowWindowStyle.circle
};

export interface ConfigStore {
  // 当前状态
  currentApp?: string;

  // 全局设置
  useHttps: boolean;
  deleteShowDialog: boolean;
  uploadOverwrite: boolean;
  theme: Theme;
  downloadDir: string;
  cacheDir: string;
  closeApp: boolean;

  // 托盘设置
  transferDoneTip: boolean;
  markdown: boolean;

  // 悬浮窗设置
  showFloatWindow: boolean;
  floatWindowStyle: FlowWindowStyle;
}
