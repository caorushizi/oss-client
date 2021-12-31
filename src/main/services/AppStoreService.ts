import DataStore from "nedb";
import * as path from "path";
import { injectable } from "inversify";
import { IStore } from "../interface";
import { appDir } from "../helper/config";
import { AppStore } from "types/common";

@injectable()
export default class AppStoreService implements IStore<AppStore> {
  private store: DataStore<AppStore | AppStore[]>;

  constructor() {
    const filename = path.join(appDir, "secrets");
    this.store = new DataStore({
      filename,
      autoload: true
    });
  }

  find(query: any): Promise<AppStore[]> {
    return new Promise((resolve, reject) => {
      this.store.find<AppStore>(query, (err, app) => {
        if (err) {
          reject(err);
        } else {
          resolve(app);
        }
      });
    });
  }

  insert(doc: AppStore): Promise<AppStore> {
    return new Promise((resolve, reject) => {
      this.store.insert(doc, (err, app) => {
        if (err) reject(err);
        resolve(app);
      });
    });
  }

  remove(query: any, options: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.store.remove(query, options, (err, n) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  update(query: any, updateQuery: any, options: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.store.update(query, updateQuery, options, (err, count) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}
