import moment from "moment";

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
