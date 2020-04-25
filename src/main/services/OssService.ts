import { injectable } from "inversify";
import { IOSS, IOssService } from "../interface";
import { OssType } from "../types";
import Qiniu from "../oss/Qiniu";

@injectable()
export default class OssService implements IOssService {
  public instance: IOSS | undefined;

  getService(): IOSS {
    if (!this.instance) {
      throw new Error("没有初始化 app");
    }
    return this.instance;
  }

  public static create(type: OssType, ak: string, sk: string): IOSS {
    switch (type) {
      case OssType.qiniu:
        return new Qiniu(ak, sk);
      default:
        throw Error("not support this oss yet");
    }
  }

  switchApp(type: OssType, ak: string, sk: string) {
    this.instance = OssService.create(type, ak, sk);
  }
}
