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
