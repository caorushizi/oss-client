import Store from "electron-store";
import { appDir, downloadDir } from "./dir";
import { ConfigStore, initialConfig } from "../types";

export const configStore = new Store<ConfigStore>({
  name: "config",
  cwd: appDir,
  fileExtension: "json",
  defaults: { ...initialConfig, downloadDir }
});
