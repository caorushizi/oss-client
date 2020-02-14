import DataStore from "nedb";
import { app } from "electron";
import * as path from "path";
import { TransferStore } from "./types";

const filename = path.join(app.getPath("downloads"), "store");
export default new DataStore<TransferStore | TransferStore[]>({
  filename,
  autoload: true
});
