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
  bucket: string;
  uploadBucket: string;
  uploadPrefix: string;
  defaultDomain: string;
};

const filename = path.join(appDir, "secrets");
console.log("\n================>", filename, "\n");

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
      bucket: "",
      uploadPrefix: "",
      uploadBucket: "",
      defaultDomain: ""
    };
    appStore.findOne({ ak }, (err, document) => {
      if (err) reject(err);
      if (!document)
        appStore.insert(app, (errInner, documentInner) => {
          if (errInner) reject(errInner);
          resolve(documentInner);
        });
      else resolve(document);
    });
  });
}

export function updateApp(app: AppStore): Promise<void> {
  return new Promise((resolve, reject) => {
    appStore.update({ _id: app._id }, app, {}, (err, count) => {
      if (err) reject(err);
      resolve();
    });
  });
}

export function deleteApp(app: AppStore): Promise<void> {
  return new Promise((resolve, reject) => {
    appStore.remove({ _id: app._id }, {}, (err, n) => {
      if (err) reject(err);
      resolve();
    });
  });
}
