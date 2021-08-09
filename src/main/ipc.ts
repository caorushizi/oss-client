import { ipcMain } from "electron";
import { GET_QINIU_TOKEN, REQUEST } from "../constants/oss";
import { getToken } from "./helper";
import request from "./request";

export default function registerIpc(): void {
  // 获取七牛云的token
  ipcMain.handle(GET_QINIU_TOKEN, (e, ...args: [string, string, string]) =>
    getToken(...args)
  );

  // 使用 electron 主进程发送网络请求
  ipcMain.handle(REQUEST, (e, options: RequestOptions) => request(options));
}
