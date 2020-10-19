import { OssType } from "../../../main/types";
import { qiniuAdapter } from "./qiniu";
import { aliAdapter } from "./ali";

export default function adapter(type: OssType, item: any[]) {
  switch (type) {
    case OssType.qiniu:
      return qiniuAdapter(item);
    case OssType.ali:
      return aliAdapter(item);
    default:
      return [];
  }
}
