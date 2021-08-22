import {
  FlowWindowStyle,
  OssType,
  TaskType,
  Theme,
  TransferStatus,
} from "./enum";

declare class VFile {
  name: string;
  webkitRelativePath: string;
  meta: any;
  type: string;
  size: number;
  lastModified: number;
  lastModifiedDate: Date;
  shortId: string;
}

declare type Task<T> = {
  id: string;
  name: string;
  size: number;
  date: number;
  type: TaskType;
  progress: number;
  result: Promise<T>;
};

declare type TransferStore = {
  id: string;
  name: string;
  size: number;
  date: number;
  type: TaskType;
  status: TransferStatus;
};

declare type AppStore = {
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

declare interface ConfigStore {
  // 当前状态
  currentAppId?: string;

  // 全局设置
  useHttps: boolean;
  deleteShowDialog: boolean;
  uploadOverwrite: boolean;
  theme: Theme;
  downloadDir: string;
  closeApp: boolean;

  // 托盘设置
  transferDoneTip: boolean;
  markdown: boolean;

  // 悬浮窗设置
  showFloatWindow: boolean;
  floatWindowStyle: FlowWindowStyle;
  uploadRename: boolean;
}
