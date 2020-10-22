import { OssType } from "../main/types";
import VFile from "./lib/vdir/VFile";

export class BucketMeta {
  name = "";

  domains: string[] = [];

  files: VFile[] = [];
}
