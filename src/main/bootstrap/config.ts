import { configStore } from "../store/config";
import { checkDirExist, mkdir } from "../helper/fs";

export async function initConfig(): Promise<void> {
  // 检查下载目录
  const downloadIsDir = await checkDirExist(configStore.get("downloadDir"));
  if (!downloadIsDir) await mkdir(configStore.get("downloadDir"));
  // 检查缓存目录
  const cacheIsDir = await checkDirExist(configStore.get("cacheDir"));
  if (!cacheIsDir) await mkdir(configStore.get("cacheDir"));
}
