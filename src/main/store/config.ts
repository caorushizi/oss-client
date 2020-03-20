import * as path from "path";
import Store from "electron-store";
import { appDir, downloadDir } from "../helper/dir";

export enum Theme {
  simple,
  colorful
}

export enum FlowWindowStyle {
  circle,
  oval
}

export const configStore = new Store<ConfigStore>({
  name: "config",
  cwd: appDir,
  fileExtension: "json",
  encryptionKey: "test",
  defaults: {
    useHttps: false,
    deleteShowDialog: true,
    uploadOverwrite: false,
    theme: Theme.colorful,
    downloadDir,
    cacheDir: path.join(appDir, "cache"),
    closeApp: false,
    transferDoneTip: true,
    markdown: true,
    floatWindowStyle: FlowWindowStyle.circle
  }
});

export interface ConfigStore {
  // 当前状态
  currentApp?: string;

  // 全局设置
  useHttps: boolean;
  deleteShowDialog: boolean;
  uploadOverwrite: boolean;
  theme: Theme;
  downloadDir: string;
  cacheDir: string;
  closeApp: boolean;

  // 托盘设置
  transferDoneTip: boolean;
  markdown: boolean;

  // 悬浮窗设置
  floatWindowStyle: FlowWindowStyle;
}
