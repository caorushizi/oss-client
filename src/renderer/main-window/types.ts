import VFile from "./lib/vdir/VFile";

export class BucketMeta {
  name = "";

  domains: string[] = [];

  files: VFile[] = [];
}

export enum OssType {
  qiniu,
  ali,

  tencent
}
