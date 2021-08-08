declare enum OssType {
  qiniu,
  ali,
  tencent,
}

declare interface Oss {
  type: OssType;
  name: string;
  ak: string;
  sk: string;
}
