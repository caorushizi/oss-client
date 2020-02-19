import { ConfigStore, getConfig } from "../store/config";
import { checkDirExist, mkdir } from "../helper/fs";

export async function initConfig(): Promise<ConfigStore> {
  const config = await getConfig();
  // 检查下载目录
  const downloadIsDir = await checkDirExist(config.downloadDir);
  if (!downloadIsDir) await mkdir(config.downloadDir);
  // 检查缓存目录
  const cacheIsDir = await checkDirExist(config.cacheDir);
  if (!cacheIsDir) await mkdir(config.cacheDir);
  return config;
}
