import DataStore from "nedb";
import { app } from "electron";
import * as path from "path";
import { SecretStore } from "../types";

const filename = path.join(app.getPath("downloads"), "secrets");
export default new DataStore<SecretStore | SecretStore[]>({
  filename,
  autoload: true
});
