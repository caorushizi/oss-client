import "reflect-metadata";
import { container } from "./inversify.config";
import { IBootstrap } from "./interface";
import SERVICE_IDENTIFIER from "./constants/identifiers";

const boot = container.get<IBootstrap>(SERVICE_IDENTIFIER.BOOTSTRAP);
boot.start();
