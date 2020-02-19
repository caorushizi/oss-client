import DataStore from "nedb";
import { app } from "electron";
import * as path from "path";
import { AppConfig } from "../types";

const filename = path.join(app.getPath("downloads"), "secrets");
export default new DataStore<AppConfig>({
  filename,
  autoload: true
});
