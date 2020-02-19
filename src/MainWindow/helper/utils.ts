import moment from "moment";
import { TaskType } from "../../main/types";

export function fileSizeFormatter(value = 0): string {
  if (!value) return "0 Bytes";
  const unitArr = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const index = Math.floor(Math.log(value) / Math.log(1024));
  const size = value / 1024 ** index;
  const sizeString = size.toFixed(2); // 保留的小数位数
  return sizeString + unitArr[index];
}

export function dateFormatter(dateVal = 0) {
  return moment(dateVal).format("YYYY-MM-DD HH:mm:ss");
}

const styles = [
  {
    appColor: "linear-gradient(#8B5C68, #37394E)",
    asideColor: "linear-gradient(#8B5C68, #484B58)"
  },
  {
    appColor: "linear-gradient(#875D56, #3A3B4E)",
    asideColor: "linear-gradient(#875D56, #484B58)"
  },
  {
    appColor: "linear-gradient(#546F67, #333B4E)",
    asideColor: "linear-gradient(#546F67, #484B58)"
  },
  {
    appColor: "linear-gradient(#7D5A86, #39394E)",
    asideColor: "linear-gradient(#7D5A86, #484B58)"
  },
  {
    appColor: "linear-gradient(#80865A, #39394E)",
    asideColor: "linear-gradient(#80865A, #484B58)"
  },
  {
    appColor: "linear-gradient(#8B5C68, #37394E)",
    asideColor: "linear-gradient(#8B5C68, #484B58)"
  }
];

export const getThemeColor = () =>
  styles[Math.floor(Math.random() * styles.length)];

export const taskTypeFormatter = (type: TaskType) =>
  type === TaskType.download ? "下载" : "上传";

export const { platform } = process;
