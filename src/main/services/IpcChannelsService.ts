import { IpcMainEvent } from "electron";
import { inject, injectable, named } from "inversify";
import SERVICE_IDENTIFIER from "../constants/identifiers";
import { IOssService, IStore } from "../interface";
import { AppStore, TransferStore } from "../types";
import TAG from "../constants/tags";

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

  async updateApp(event: IpcMainEvent, ...args: any[]) {
    const [app] = args;
    return this.appStore.update({}, {}, {});
  }

  async deleteApp(event: IpcMainEvent, ...args: any[]) {
    const [app] = args;
    return this.appStore.remove({}, {});
  }

  async getApps(event: IpcMainEvent, ...args: any[]) {
    return this.appStore.find({});
  }

  async initApp(event: IpcMainEvent, id: string) {
    const query: any = {};
    if (id) query.id = id;
    const findApps = await this.appStore.find(query);
    if (findApps.length > 0) {
      const app = findApps[0];
      this.oss.switchApp(app.type, app.ak, app.sk);
    }
  }

  // async addApp() {
  //   const { name, ak, sk, type } = request.params;
  //   const app = await this.appStore.insert({});
  // }

  // async removeTransfers() {
  //   await this.transferStore.remove({}, {});
  // }

  // async getBuckets() {
  //   const instance = AppInstance.getInstance();
  //   const { oss } = instance;
  //   const buckets = await oss.getBucketList();
  // }

  // async getConfig() {
  //   const config = configStore.store;
  // }

  // async getTransfers() {
  //   const transfers = await this.transferStore.find({});
  // }

  // async getUpdateFiles() {
  //   const recentStoreList = await this.transferStore.find({});
  // }

  // async switchBucket() {
  //   const instance = AppInstance.getInstance();
  //   const { oss } = instance;
  //   oss.setBucket(request.params);
  //   const files = await oss.getBucketFiles();
  //   const domains = await oss.getBucketDomainList();
  // }
}
