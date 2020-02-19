import DataStore from "nedb";
import * as path from "path";
import { TransferStore } from "../types";
import { appDir } from "../helper/dir";

const filename = path.join(appDir, "transfers");
export default new DataStore<TransferStore | TransferStore[]>({
  filename,
  autoload: true
});
