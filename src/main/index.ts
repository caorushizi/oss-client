import "reflect-metadata";
import { errorLog, infoLog } from "./logger";
import { container } from "./inversify.config";
import { IBootstrap } from "./interface";
import SERVICE_IDENTIFIER from "./identifiers";

infoLog("============== 开始程序 ============");

const boot = container.get<IBootstrap>(SERVICE_IDENTIFIER.BOOTSTRAP);
boot.start();
