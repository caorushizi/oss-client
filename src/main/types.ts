export enum OssType {
  qiniu = "qiniu",
  ali = "ali",
  tencent = "tencent"
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

export enum FlowWindowStyle {
  circle,
  oval
}

export enum Theme {
  simple,
  colorful
}
