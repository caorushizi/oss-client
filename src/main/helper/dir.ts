import { app } from "electron";
import * as path from "path";

export const appDir = path.join(app.getPath("appData"), "oss client");
export const downloadDir = app.getPath("downloads");
