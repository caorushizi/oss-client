import configStore from "../store/config";
import { checkDirExist } from "../helper/fs";

export function initConfig(id: string) {
  configStore.findOne({}, (err, config) => {
    // 检查下载目录
    checkDirExist(config.downloadDir).then();
    // 检查缓存目录
    console.log(config);
  });
}
