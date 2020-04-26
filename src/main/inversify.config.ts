import { Container } from "inversify";
import SERVICE_IDENTIFIER from "./constants/identifiers";
import {
  IApp,
  IBootstrap,
  IIpcService,
  ILogger,
  IOssService,
  IStore,
  ITaskRunner
} from "./interface";
import {
  AppStoreService,
  ElectronAppService,
  IpcChannelsService,
  LoggerService,
  SimpleBootService,
  TaskRunnerService,
  TransferStoreService
} from "./services";
import TAG from "./constants/tags";
import { AppStore, TransferStore } from "./types";
import OssService from "./services/OssService";

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
  .bind<IBootstrap>(SERVICE_IDENTIFIER.BOOTSTRAP)
  .to(SimpleBootService)
  .inSingletonScope();
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
  .bind<IIpcService>(SERVICE_IDENTIFIER.CHANNELS)
  .to(IpcChannelsService)
  .inSingletonScope();
container
  .bind<IOssService>(SERVICE_IDENTIFIER.OSS)
  .to(OssService)
  .inSingletonScope();

export { container };
