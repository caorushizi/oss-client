import fs from "fs";

export function checkDirExist(path: string) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        throw err;
      }
      if (stats.isDirectory()) {
        resolve();
      } else {
        reject();
      }
    });
  });
}
