import "reflect-metadata";
import { container } from "./inversify.config";
import SERVICE_IDENTIFIER from "./constants/identifiers";
import { IApp } from "./interface";

// TODO: electron-debug
const app = container.get<IApp>(SERVICE_IDENTIFIER.ELECTRON_APP);
app.init();
