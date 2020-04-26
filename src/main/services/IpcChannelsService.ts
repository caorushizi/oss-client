import { inject, injectable, named } from "inversify";
import SERVICE_IDENTIFIER from "../constants/identifiers";
import { IOssService, IStore } from "../interface";
import { AppStore, TransferStatus, TransferStore } from "../types";
import TAG from "../constants/tags";
import { configStore } from "../helper/config";

@injectable()
export default class IpcChannelsService {
  @inject(SERVICE_IDENTIFIER.STORE)
  @named(TAG.APP_STORE)
  // @ts-ignore
  appStore: IStore<AppStore>;

  @inject(SERVICE_IDENTIFIER.STORE)
  @named(TAG.TRANSFER_STORE)
  // @ts-ignore
  transferStore: IStore<TransferStore>;

  // @ts-ignore
  @inject(SERVICE_IDENTIFIER.OSS) oss: IOssService;

  async updateApp(app: AppStore): Promise<void> {
    return this.appStore.update({ _id: app._id }, app, {});
  }

  async deleteApp(app: AppStore) {
    return this.appStore.remove({ _id: app._id }, {});
  }

  async getApps() {
    console.log("获取所有 Apps");
    return this.appStore.find({});
  }

  async initApp(id: string) {
    const query: any = {};
    if (id) query.id = id;
    const findApps = await this.appStore.find(query);
    if (findApps.length > 0) {
      const app = findApps[0];
      this.oss.switchApp(app.type, app.ak, app.sk);
    }
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

  async switchBucket(bucketName: string) {
    const instance = this.oss.getService();
    instance.setBucket(bucketName);
    const files = await instance.getBucketFiles();
    const domains = await instance.getBucketDomainList();
    return { files, domains };
  }
}
