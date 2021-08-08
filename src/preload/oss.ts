import { ipcRenderer } from "electron";
import { GET_BUCKETS } from "../constants/oss";

export function getBuckets(item): Promise<any> {
  return ipcRenderer.invoke(GET_BUCKETS, item);
}
