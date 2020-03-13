import DataStore from "nedb";
import * as path from "path";
import { appDir } from "../helper/dir";
import { OssType } from "../types";

export type AppStore = {
  type: OssType;
  ak: string;
  sk: string;
  name: string;
  _id?: string;
  bucket?: string;
  uploadBucket?: string;
  uploadPrefix?: string;
};

const filename = path.join(appDir, "secrets");
console.log(filename);
const appStore = new DataStore<AppStore | AppStore[]>({
  filename,
  autoload: true
});

export function getAppById(id: string): Promise<AppStore> {
  return new Promise((resolve, reject) => {
    appStore.findOne({ _id: id }, (err, app: AppStore) => {
      if (err) reject(err);
      if (app) resolve(app);
      else reject(new Error("还没有 App ！"));
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

export function addApp(name: string, type: OssType, ak: string, sk: string) {
  return new Promise((resolve, reject) => {
    const app: AppStore = {
      name,
      ak,
      sk,
      type,
      uploadBucket: "",
      uploadPrefix: ""
    };
    appStore.insert(app, (err, document) => {
      if (err) reject(err);
      resolve(document);
    });
  });
}
