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
export enum TransferStatus {
  default,
  done,
  failed
}

export interface AppConfig {
  useHttps: boolean;
  deleteShowDialog: boolean;
  uploadOverwrite: boolean;
  theme: Theme;
  downloadDir: string;
  cacheDir: string;
  closeApp: boolean;

  transferDoneTip: boolean;
  markdown: boolean;

  floatWindowStyle: FlowWindowStyle;
}

export enum Theme {
  simple,
  colorful
}

export enum FlowWindowStyle {
  circle,
  oval
}

export type SecretStore = {
  id: string;
  ak: string;
  sk: string;
  name: string;
  bucket: string;
  uploadBucket: string;
  uploadPrefix: string;
};
