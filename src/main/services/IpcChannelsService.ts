import { inject, injectable, named } from "inversify";
import { v4 as uuidV4 } from "uuid";
import path from "path";
import * as fs from "fs";
import { v1 as uuidV1 } from "uuid";
import SERVICE_IDENTIFIER from "../constants/identifiers";
import { ILogger, IOssService, IStore, ITaskRunner } from "../interface";
import TAG from "../constants/tags";
import { configStore } from "../helper/config";
import OssService from "./OssService";
import { fattenFileList, pathStatsSync } from "../helper/utils";
import { OssType, TaskType, TransferStatus } from "types/enum";
import { AppStore, Task } from "types/common";

@injectable()
export default class IpcChannelsService {
  // @ts-ignore
  @inject(SERVICE_IDENTIFIER.TASK_RUNNER) public taskRunner: ITaskRunner;
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
    let finallyApp: AppStore;
    if (params.id) {
      // 传入 id 证明用户选择了 id
      const findApps = await this.appStore.find({ _id: params.id });
      if (findApps.length <= 0) throw new Error("没有可初始化的 app");
      [finallyApp] = findApps;
    } else {
      // 软件初始化
      const currentAppId = configStore.get("currentAppId");
      if (currentAppId) {
        // 有默认值
        const findApps = await this.appStore.find({ _id: currentAppId });
        if (findApps.length <= 0) throw new Error("没有可初始化的 app");
        [finallyApp] = findApps;
      } else {
        const findApps = await this.appStore.find({});
        if (findApps.length <= 0) throw new Error("没有可初始化的 app");
        [finallyApp] = findApps;
      }
    }

    this.oss.changeContext(finallyApp.type, finallyApp.ak, finallyApp.sk);
    return finallyApp;
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

  async switchBucket(bucketName: string) {
    const instance = this.oss.getService();
    await instance.setBucket(bucketName);
    const files = await instance.getBucketFiles();
    const domains = await instance.getBucketDomainList();
    return { files, domains, type: instance.type };
  }

  async refreshBucket(force: boolean) {
    // todo: 缓存
    const instance = this.oss.getService();
    const files = await instance.getBucketFiles();
    const domains = await instance.getBucketDomainList();
    return { files, domains, type: instance.type };
  }

  async uploadFiles(params: any) {
    const { remoteDir, fileList, flag } = params;
    const instance = this.oss.getService();
    const baseDir = path.dirname(fileList[0]);
    const filepathList = fattenFileList(fileList);
    for (const filepath of filepathList) {
      const relativePath = path.relative(baseDir, filepath);

      let remotePath;
      // 如果是从悬浮传的文件，判断 flag
      if (flag) {
        // 如果 flag 为 true，在所有路径前面添加 uploadPrefix
        const { appId } = instance;
        const [curAppStore] = await this.appStore.find({ ak: appId });
        const prefix = curAppStore?.uploadPrefix || "";
        remotePath = path.join(prefix, relativePath);
        if (configStore.get("uploadRename")) {
          // 需要重命名
          remotePath = path.join(
            path.dirname(remotePath),
            uuidV1() + path.extname(remotePath)
          );
        }
      } else {
        remotePath = path.join(remoteDir, relativePath);
      }
      remotePath = remotePath.replace(/\\+/g, "/");

      const id = uuidV4();
      const callback = (taskId: string, process: number) =>
        this.taskRunner.setProgress(taskId, process);
      const task: Task<any> = {
        id,
        name: path.basename(remotePath),
        date: Date.now(),
        type: TaskType.upload,
        size: pathStatsSync(filepath).size,
        progress: 0,
        result: instance.uploadFile(id, remotePath, filepath, callback),
      };
      // 添加任务，自动执行
      this.taskRunner.addTask(task);
    }
  }

  async downloadFiles(params: any) {
    const { remoteDir, fileList } = params;
    const instance = this.oss.getService();
    const customDownloadDir = configStore.get("downloadDir");
    for (const item of fileList) {
      const remotePath = item.webkitRelativePath;
      const localPath = path.relative(remoteDir, item.webkitRelativePath);
      const downloadPath = path.join(customDownloadDir, localPath);
      fs.mkdirSync(path.dirname(downloadPath), { recursive: true });

      const id = uuidV4();
      const callback = (taskId: string, process: number) =>
        this.taskRunner.setProgress(taskId, process);
      const task: Task<any> = {
        id,
        name: path.basename(localPath),
        date: Date.now(),
        type: TaskType.upload,
        size: item.size,
        progress: 0,
        result: instance.downloadFile(id, remotePath, downloadPath, callback),
      };
      // 添加任务，自动执行
      this.taskRunner.addTask(task);
    }
  }

  async deleteFiles(remotePaths: string[]) {
    const instance = this.oss.getService();
    for (const remotePath of remotePaths) {
      await instance.deleteFile(remotePath);
    }
  }

  async getFileUrl(remotePath: string) {
    const instance = this.oss.getService();
    return instance.generateUrl(remotePath);
  }
}
