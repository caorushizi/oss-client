import { OssType } from "../main/types";

export class BucketMeta {
  name = "";

  domains: string[] = [];

  files: string[] = [];

  type: OssType = OssType.qiniu;
}
