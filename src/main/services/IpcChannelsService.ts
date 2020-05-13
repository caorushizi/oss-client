import { inject, injectable, named } from "inversify";
import SERVICE_IDENTIFIER from "../constants/identifiers";
import { ILogger, IOssService, IStore } from "../interface";
import { AppStore, TransferStatus, TransferStore } from "../types";
import TAG from "../constants/tags";
import { configStore } from "../helper/config";

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

  async deleteApp(app: AppStore) {
    return this.appStore.remove({ _id: app._id }, {});
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
    }
    return true;
  }

  async addApp(params: any) {
    return this.appStore.insert({ ...params });
  }

  async removeTransfers(status: TransferStatus) {
    return this.transferStore.remove({ status }, { multi: true });
  }

  async getBuckets() {
    const instance = this.oss.getService();
    return instance.getBucketList();
  }

  getConfig = async () => configStore.store;

  async getTransfers(status: TransferStatus) {
    return this.transferStore.find({ status });
  }

  async switchBucket(params: any) {
    const instance = this.oss.getService();
    instance.setBucket(params.bucketName);
    const files = await instance.getBucketFiles();
    const domains = await instance.getBucketDomainList();
    return { files, domains };
  }
}
