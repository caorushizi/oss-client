import { ipcMain } from "electron";
import { GET_BUCKETS } from "../../constants/oss";
import Qiniu from "../oss/Qiniu";

ipcMain.handle(
  GET_BUCKETS,
  (e, item: { name: string; ak: string; sk: string }) => {
    const oss = new Qiniu(item.name, item.ak, item.sk);
    return oss.getBucketList();
  }
);
