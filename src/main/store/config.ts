import Store from "electron-store";
import { appDir, downloadDir } from "../helper/dir";
import { ConfigStore, initialConfig } from "../types";

export const configStore = new Store<ConfigStore>({
  name: "config",
  cwd: appDir,
  fileExtension: "json",
  // encryptionKey: "test",
  defaults: { ...initialConfig, downloadDir }
});
