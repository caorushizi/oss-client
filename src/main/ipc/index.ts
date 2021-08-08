import "./oss";
import { ipcMain } from "electron";
import request from "../request";

ipcMain.on("request", (e, args) => {
  const { url } = args;
  return request(url);
});
