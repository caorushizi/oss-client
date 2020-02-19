import configStore from "../store/config";

export function initConfig(id: string) {
  configStore.findOne({}, (err, config) => {
    // 检查下载目录
    // 检查缓存目录
    console.log(config);
  });
}
