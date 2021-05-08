import { VFile } from "types/common";

export class BucketMeta {
  name = "";
  domains: string[] = [];
  files: VFile[] = [];
}
