import DataStore from "nedb";
import * as path from "path";
import { appDir } from "../helper/dir";
import { OssType } from "../types";

export type AppStore = {
  id?: string;
  type: OssType;
  ak: string;
  sk: string;
  name: string;
  bucket?: string;
  uploadBucket: string;
  uploadPrefix: string;
};

const filename = path.join(appDir, "secrets");
const appStore = new DataStore<AppStore | AppStore[]>({
  filename,
  autoload: true
});

export function getAppById(id: string): Promise<AppStore> {
  return new Promise((resolve, reject) => {
    appStore.findOne({ id }, (err, app: AppStore) => {
      if (err) {
        reject(err);
      }
      if (app) {
        resolve(app);
      } else {
        reject(new Error("还没有 App ！"));
      }
    });
  });
}

export function getApps(): Promise<AppStore[]> {
  return new Promise((resolve, reject) => {
    appStore.find({}, (err, documents: AppStore[]) => {
      if (err) {
        reject(err);
      }
      resolve(documents);
    });
  });
}
