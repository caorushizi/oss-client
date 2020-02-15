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

export type AppConfig = {};

export type Store = {
  transfer: TransferStore[];
  config: AppConfig;
  secrets: string[];
};

export type SecretStore = {
  id: string;
  ak: string;
  sk: string;
  name: string;
};
