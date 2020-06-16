import { inject, injectable, named } from "inversify";
import SERVICE_IDENTIFIER from "../constants/identifiers";
import { ILogger, IOssService, IStore } from "../interface";
import { AppStore, OssType, TransferStatus, TransferStore } from "../types";
import TAG from "../constants/tags";
import { configStore } from "../helper/config";
import OssService from "./OssService";

@injectable()
export default class IpcChannelsService {
  @inject(SERVICE_IDENTIFIER.STORE)
  @named(TAG.APP_STORE)
  // @ts-ignore
  private appStore: IStore<AppStore>;

  @inject(SERVICE_IDENTIFIER.STORE)
  @named(TAG.TRANSFER_STORE)
  // @ts-ignore
  private transferStore: IStore<TransferStore>;

  // @ts-ignore
  @inject(SERVICE_IDENTIFIER.OSS) private oss: IOssService;

  // @ts-ignore
  @inject(SERVICE_IDENTIFIER.LOGGER) private logger: ILogger;

  async updateApp(app: AppStore): Promise<void> {
    return this.appStore.update({ _id: app._id }, app, {});
  }

  async deleteApp(id: string) {
    const selected = await this.appStore.find({ _id: id });
    if (!selected) {
      throw new Error("没有找到该 app");
    }
    return this.appStore.remove({ _id: id }, {});
  }

  async getApps() {
    return this.appStore.find({});
  }

  async initApp(params: any) {
    const query: any = {};
    if (params.id) query._id = params.id;
    const findApps = await this.appStore.find(query);
    if (findApps.length > 0) {
      const app = findApps[0];
      this.oss.switchApp(app.type, app.ak, app.sk);
      return app;
    }
    throw new Error("没有可初始化的 app");
  }

  async addApp(params: any) {
    const { name, ak } = params;
    // 1、判断是否已经存在 name
    const appsByName = await this.appStore.find({ name });
    if (appsByName.length > 0) throw new Error("应用名称已经存在");
    // 2、判断是否已经存在 ak
    const appsByAk = await this.appStore.find({ ak });
    if (appsByAk.length > 0) throw new Error("该 AK 已经存在");
    // 通过验证保存数据
    return this.appStore.insert({ ...params });
  }

  async removeTransfers(status: TransferStatus) {
    return this.transferStore.remove({ status }, { multi: true });
  }

  async getBuckets(params?: { type: OssType; ak: string; sk: string }) {
    if (params && Object.keys(params).length > 0) {
      // 返回当前配置的 bucket 列表
      const { type, ak, sk } = params;
      const app = OssService.create(type, ak, sk);
      return app.getBucketList();
    }
    // 返回当前上下文的 bucket 列表
    const instance = this.oss.getService();
    return instance.getBucketList();
  }

  getConfig = async () => configStore.store;

  async getTransfers(query: any) {
    return this.transferStore.find(query);
  }

  async switchBucket(params: any) {
    const { bucketName } = params;
    const instance = this.oss.getService();
    instance.setBucket(bucketName);
    const files = await instance.getBucketFiles();
    const domains = await instance.getBucketDomainList();
    return { files, domains };
  }
}
