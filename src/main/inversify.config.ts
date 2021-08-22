import { Container } from "inversify";
import SERVICE_IDENTIFIER from "./constants/identifiers";
import { IApp, ILogger, IOssService, IStore, ITaskRunner } from "./interface";
import {
  AppStoreService,
  ElectronAppService,
  IpcChannelsService,
  LoggerService,
  TaskRunnerService,
  TransferStoreService,
} from "./services";
import TAG from "./constants/tags";
import OssService from "./services/OssService";
import { AppStore, TransferStore } from "types/common";

const container = new Container();

// 程序主入口
container
  .bind<IStore<TransferStore>>(SERVICE_IDENTIFIER.STORE)
  .to(TransferStoreService)
  .inSingletonScope()
  .whenTargetNamed(TAG.TRANSFER_STORE);
container
  .bind<IStore<AppStore>>(SERVICE_IDENTIFIER.STORE)
  .to(AppStoreService)
  .inSingletonScope()
  .whenTargetNamed(TAG.APP_STORE);
container
  .bind<IApp>(SERVICE_IDENTIFIER.ELECTRON_APP)
  .to(ElectronAppService)
  .inSingletonScope();
container
  .bind<ILogger>(SERVICE_IDENTIFIER.LOGGER)
  .to(LoggerService)
  .inSingletonScope();
container
  .bind<ITaskRunner>(SERVICE_IDENTIFIER.TASK_RUNNER)
  .to(TaskRunnerService)
  .inSingletonScope();
container
  .bind<IpcChannelsService>(SERVICE_IDENTIFIER.CHANNELS)
  .to(IpcChannelsService)
  .inSingletonScope();
container
  .bind<IOssService>(SERVICE_IDENTIFIER.OSS)
  .to(OssService)
  .inSingletonScope();

export { container };
