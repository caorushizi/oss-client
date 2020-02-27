import { IObjectStorageService } from "./services/types";
import services from "./services";
import { OssType } from "./types";

export default class AppInstance {
  private static instance: AppInstance;

  private factory: IObjectStorageService;

  private constructor(type: OssType, ak: string, sk: string) {
    const factory = services.create;
    this.factory = factory(type, ak, sk);
  }

  static changeApp(type: OssType, ak: string, sk: string) {
    AppInstance.instance = new AppInstance(type, ak, sk);
  }

  static getInstance() {
    if (!AppInstance.instance) {
      throw new Error("没有初始化 app");
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
