export enum OssType {
  qiniu,
  ali,
  tencent,
}

export interface Oss {
  type: OssType;
  name: string;
  ak: string;
  sk: string;
}

export enum OssMode {
  add,
  edit,
  view,
}
