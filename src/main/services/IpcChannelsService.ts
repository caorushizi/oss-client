import { inject, injectable, named } from "inversify";
import uuid from "uuid/v4";
import path from "path";
import SERVICE_IDENTIFIER from "../constants/identifiers";
import { ILogger, IOssService, IStore, ITaskRunner } from "../interface";
import {
  AppStore,
  OssType,
  TaskType,
  TransferStatus,
  TransferStore
} from "../types";
import TAG from "../constants/tags";
import { configStore } from "../helper/config";
import OssService from "./OssService";
import { fattenFileList, pathStatsSync } from "../helper/utils";
import VFile from "../../MainWindow/lib/vdir/VFile";

@injectable()
export default class IpcChannelsService {
  @inject(SERVICE_IDENTIFIER.STORE)
  @named(TAG.APP_STORE)
  // @ts-ignore
  private appStore: IStore<AppStore>;

  @inject(SERVICE_IDENTIFIER.STORE)
  @named(TAG.TRANSFER_STORE)
  // @ts-ignore
  private transfers: IStore<TransferStore>;

  @inject(SERVICE_IDENTIFIER.STORE)
  @named(TAG.TRANSFER_STORE)
  // @ts-ignore
  private transferStore: IStore<TransferStore>;

  // @ts-ignore
  @inject(SERVICE_IDENTIFIER.OSS) private oss: IOssService;

  // @ts-ignore
  @inject(SERVICE_IDENTIFIER.LOGGER) private logger: ILogger;

  // @ts-ignore
  @inject(SERVICE_IDENTIFIER.TASK_RUNNER) public taskRunner: ITaskRunner;

  async updateApp(app: AppStore): Promise<void> {
    return this.appStore.update({ _id: app._id }, app, {});
  }

  async deleteApp(id: string) {
    // 查找数据库中是否存在
    const selected = await this.appStore.find({ _id: id });
    if (!selected) throw new Error("没有找到该 app");
    // 删除数据
    await this.appStore.remove({ _id: id }, {});
    // 清理上下文信息
    this.oss.clearContext();
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
      this.oss.changeContext(app.type, app.ak, app.sk);
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

  async uploadFile(params: any) {
    const { remoteDir, filepath } = params;
    const instance = this.oss.getService();
    const baseDir = path.dirname(filepath);
    const callback = (id: string, progress: string) => {
      console.log(`${id} - progress ${progress}%`);
    };

    const fileSize = pathStatsSync(filepath).size;
    const relativePath = path.relative(baseDir, filepath);
    let remotePath = path.join(remoteDir, relativePath);
    remotePath = remotePath.replace(/\\+/g, "/");

    const id = uuid();
    const newDoc = {
      id,
      name: path.basename(remotePath),
      date: Date.now(),
      type: TaskType.upload,
      size: fileSize,
      status: TransferStatus.default
    };
    // 存储下载信息
    const transfers = await this.transfers.insert(newDoc);
    // 添加任务，自动执行
    this.taskRunner.addTask<any>({
      ...transfers,
      result: instance.uploadFile(id, remotePath, filepath, callback)
    });
  }

  async uploadFiles(params: any) {
    const { remoteDir, fileList } = params;
    const instance = this.oss.getService();
    const baseDir = path.dirname(fileList[0]);
    const filepathList = fattenFileList(fileList);
    for (const filepath of filepathList) {
      const fileSize = pathStatsSync(filepath).size;
      const callback = (id: string, progress: string) => {
        console.log(`${id} - progress ${progress}%`);
      };
      const relativePath = path.relative(baseDir, filepath);
      let remotePath = path.join(remoteDir, relativePath);
      remotePath = remotePath.replace(/\\+/g, "/");

      const id = uuid();
      const newDoc = {
        id,
        name: path.basename(remotePath),
        date: Date.now(),
        type: TaskType.upload,
        size: fileSize,
        status: TransferStatus.default
      };
      // 存储下载信息
      // eslint-disable-next-line no-await-in-loop
      const transfers = await this.transfers.insert(newDoc);
      // 添加任务，自动执行
      this.taskRunner.addTask<any>({
        ...transfers,
        result: instance.uploadFile(id, remotePath, filepath, callback)
      });
    }
  }

  async downloadFile(item: VFile) {
    const instance = this.oss.getService();
    const remotePath = item.webkitRelativePath;
    const customDownloadDir = configStore.get("downloadDir");
    const downloadPath = path.join(customDownloadDir, item.webkitRelativePath);
    const callback = (id: string, progress: string) => {
      console.log(`${id} - progress ${progress}%`);
    };
    const id = uuid();
    const newDoc = {
      id,
      name: item.name,
      date: Date.now(),
      type: TaskType.download,
      size: item.size,
      status: TransferStatus.default
    };
    // 存储下载信息
    const document = await this.transfers.insert(newDoc);
    // 添加任务，自动执行
    this.taskRunner.addTask<TransferStore>({
      ...document,
      result: instance.downloadFile(id, remotePath, downloadPath, callback)
    });
  }

  async deleteFile(remotePath: string) {
    const instance = this.oss.getService();
    await instance.deleteFile(remotePath);
  }

  async deleteFiles(remotePaths: string[]) {
    const instance = this.oss.getService();
    for (const remotePath of remotePaths) {
      await instance.deleteFile(remotePath);
    }
  }
}
