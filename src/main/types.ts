import { FlowWindowStyle, OssType, Theme } from "types/enum";

export const OssTypeMap = {
  [OssType.qiniu]: "七牛云",
  [OssType.ali]: "阿里云",
  [OssType.tencent]: "腾讯云"
};

export const initialConfig = {
  useHttps: false,
  deleteShowDialog: true,
  uploadOverwrite: false,
  theme: Theme.colorful,
  downloadDir: "",
  cacheDir: "",
  closeApp: false,
  transferDoneTip: true,
  markdown: true,
  showFloatWindow: true,
  floatWindowStyle: FlowWindowStyle.circle,
  uploadRename: false
};
