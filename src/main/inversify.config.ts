import { Container } from "inversify";
import SERVICE_IDENTIFIER from "./identifiers";
import { IApp, IBootstrap, ITaskRunner } from "./interface";
import SimpleBoot from "./simple-boot";
import App from "./app";
import TaskRunner from "./helper/tasks";

const container = new Container();

// 程序主入口
container.bind<IBootstrap>(SERVICE_IDENTIFIER.BOOTSTRAP).to(SimpleBoot);
container.bind<IApp>(SERVICE_IDENTIFIER.ELECTRON_APP).to(App);
container.bind<ITaskRunner>(SERVICE_IDENTIFIER.TASK_RUNNER).to(TaskRunner);

export { container };
