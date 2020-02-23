import { IObjectStorageService } from "./services/types";
import services from "./services";
import { OssType } from "./types";

export default class AppInstance {
  private static instance: AppInstance;

  private factory: IObjectStorageService;

  private constructor() {
    const factory = services.create;
    const ak = "aKFa7HTRldSWSXpd3nUECT-M4lnGpTHVjKhHsWHD";
    const sk = "7MODMEi2H4yNnHmeeLUG8OReMtcDCpuXHTIUlYtL";
    this.factory = factory(OssType.qiniu, ak, sk);
  }

  static getInstance() {
    if (!AppInstance.instance) {
      AppInstance.instance = new AppInstance();
    }
    return AppInstance.instance;
  }

  get oss(): IObjectStorageService {
    return this.factory;
  }

  set oss(score) {
    this.factory = score;
  }
}
