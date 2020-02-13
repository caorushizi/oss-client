import Qiniu from "./Impl/Qiniu";
import { IObjectStorageService } from "./types";
import { OssType } from "../types";

export default class OssFactory {
  public static create(
    type: OssType,
    ak: string,
    sk: string
  ): IObjectStorageService {
    switch (type) {
      case OssType.qiniu:
        return new Qiniu(ak, sk);
      default:
        throw Error("not support this oss yet");
    }
  }
}
