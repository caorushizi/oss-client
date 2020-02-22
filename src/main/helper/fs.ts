import fs, { Stats } from "fs";

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

export function pathStatsSync(path: string): Stats {
  return fs.statSync(path);
}
