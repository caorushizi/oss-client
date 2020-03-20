import klawSync from "klaw-sync";
import { pathStatsSync } from "./fs";

export function convertPath(path: string) {
  return path.replace(/\\/g, "/");
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
