import { ipcMain } from "electron";
import { GET_QINIU_TOKEN } from "../constants/oss";
import { getToken } from "./helper";

export default function registerIpc(): void {
  ipcMain.handle(GET_QINIU_TOKEN, (e, ...args: [string, string, string]) =>
    getToken(...args)
  );
}
