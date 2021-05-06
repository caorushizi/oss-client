import { injectable } from "inversify";
import { IOSS, IOssService } from "../interface";
import { OssType } from "../types";
import Qiniu from "../oss/Qiniu";
import Ali from "../oss/Ali";
import Tencent from "../oss/Tencent";

@injectable()
export default class OssService implements IOssService {
  public instance: IOSS | null = null;

  public static create(type: OssType, ak: string, sk: string): IOSS {
    switch (type) {
      case OssType.qiniu:
        return new Qiniu(ak, sk);
      case OssType.ali:
        return new Ali(ak, sk);
      case OssType.tencent:
        return new Tencent(ak, sk);
      default:
        throw Error("暂时还不支持该云存储厂商");
    }
  }

  getService(): IOSS {
    if (!this.instance) {
      throw new Error("没有初始化 app");
    }
    return this.instance;
  }

  changeContext(type: OssType, ak: string, sk: string) {
    this.instance = OssService.create(type, ak, sk);
  }

  clearContext() {
    this.instance = null;
  }
}
