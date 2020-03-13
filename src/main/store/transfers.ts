import DataStore from "nedb";
import * as path from "path";
import { TransferStore } from "../types";
import { appDir } from "../helper/dir";

const filename = path.join(appDir, "transfers");
const transferStore = new DataStore<TransferStore | TransferStore[]>({
  filename,
  autoload: true
});

export function getTransfers(): Promise<TransferStore[]> {
  return new Promise((resolve, reject) => {
    transferStore.find<TransferStore>({}, (err, documents) => {
      if (err) reject(err);
      resolve(documents);
    });
  });
}

export function insertTransfer(doc: TransferStore): Promise<TransferStore> {
  return new Promise((resolve, reject) => {
    transferStore.insert<TransferStore>(doc, (err, document) => {
      if (err) reject(err);
      resolve(document);
    });
  });
}
