import klawSync from "klaw-sync";
import fs, { Stats } from "fs";
import EventEmitter from "events";

export function pathStatsSync(path: string): Stats {
  return fs.statSync(path);
}

export function fattenFileList(fileList: string[]): string[] {
  return fileList.reduce((prev: string[], cur: string) => {
    const stats = pathStatsSync(cur);
    if (stats.isFile()) return [...prev, cur];
    if (stats.isDirectory()) {
      const paths = klawSync(cur, {
        nodir: true,
        filter(f) {
          return !/\.(DS_Store)$/.test(f.path);
        }
      }).map(i => i.path);
      return [...prev, ...paths];
    }
    return prev;
  }, []);
}

export function checkDirExist(path: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) =>
      err ? resolve(false) : resolve(stats.isDirectory())
    );
  });
}

export function mkdir(path: string): Promise<undefined> {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, { recursive: true }, err => (err ? reject(err) : resolve()));
  });
}

export function success(data: any): IpcResponse {
  return { code: 0, msg: "成功", data };
}

export function fail(code: number, msg: string): IpcResponse {
  return { code, msg, data: {} };
}

class MyEmitter extends EventEmitter {}

export const emitter = new MyEmitter();
