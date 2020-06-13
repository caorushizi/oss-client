declare module "*.svg";
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.bmp";
declare module "*.tiff";
declare module "*.mp3";

declare interface BucketItem {
  name: string;
  webkitRelativePath: string;
  meta: any;
  type: string;
  size: number;
  lastModified: number;
  lastModifiedDate: Date;
}

declare interface BucketAdapter {
  (data: any): BucketItem[];
}

declare enum OssType {
  qiniu = "七牛云",
  ali = "阿里云",
  tencent = "腾讯云"
}

declare interface AddForm {
  name: string;
  ak: string;
  sk: string;
  type: OssType;
}

declare interface IpcResponse {
  code: number;
  msg: string;
  data: any;
}

declare interface IpcSuccessFn {
  (data: any): IpcResponse;
}

declare interface IpcFailFn {
  (code: number, msg: string): IpcResponse;
}
