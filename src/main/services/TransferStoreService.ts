import DataStore from "nedb";
import * as path from "path";
import { injectable } from "inversify";
import { TransferStore } from "../types";
import { appDir } from "../helper/dir";
import { IStore } from "../interface";

@injectable()
export default class TransferStoreService implements IStore<TransferStore> {
  private store: DataStore<TransferStore | TransferStore[]>;

  constructor() {
    const filename = path.join(appDir, "transfers");
    this.store = new DataStore({
      filename,
      autoload: true
    });
  }

  find(query: any) {
    return new Promise<TransferStore[]>((resolve, reject) => {
      this.store.find<TransferStore>(query, (err, documents) => {
        if (err) {
          reject(err);
        } else {
          resolve(documents);
        }
      });
    });
  }

  insert(doc: TransferStore) {
    return new Promise<TransferStore>((resolve, reject) => {
      this.store.insert<TransferStore>(doc, (err, document) => {
        if (err) reject(err);
        resolve(document);
      });
    });
  }

  update(query: any, updateQuery: any, options: any) {
    return new Promise<void>((resolve, reject) => {
      // { id },
      // { $set: { status: TransferStatus.done } },
      this.store.update(query, updateQuery, options, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  remove(query: any, options: any) {
    return new Promise<void>((resolve, reject) => {
      // { status: TransferStatus.done },
      // { multi: true },
      this.store.remove(query, options, (err, n) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}