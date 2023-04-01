import moment from "moment";
import mime from "mime";
import { TaskType } from "types/enum";

export function fileSizeFormatter(value = 0): string {
  if (!value) return "0 Bytes";
  const unitArr = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const index = Math.floor(Math.log(value) / Math.log(1024));
  const size = value / 1024 ** index;
  const sizeString = size.toFixed(2); // 保留的小数位数
  return sizeString + unitArr[index];
}

export function dateFormatter(dateVal = 0) {
  return moment(dateVal).format("YYYY年MM月DD日 HH:mm:ss");
}

const styles: ThemeColor[] = [
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

const mapType: Record<string, string> = {
  "text/css": "icon-css",
  "application/javascript": "icon-js",
  "application/pdf": "icon-pdf",
  "text/plain": "icon-documents",
  "image/gif": "icon-gif",
  "image/png": "icon-png",
  "image/jpeg": "icon-jpg",
  "application/octet-stream": "icon-exe",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "icon-doc"
};

export interface ThemeColor {
  appColor: string;
  asideColor: string;
}

export const getThemeColor: () => ThemeColor = () =>
  styles[Math.floor(Math.random() * styles.length)];

export const getBgOffset: () => string = () => {
  const bgOffsetX = Math.ceil((Math.random() - 0.5) * 800);
  const bgOffsetY = Math.ceil((Math.random() - 0.5) * 600);
  return `${bgOffsetX}px, ${bgOffsetY}px`;
};

export const taskTypeFormatter = (type: TaskType) =>
  type === TaskType.download ? "下载" : "上传";

export const getPlatform = () => process.platform;

export function getIconName(filename: string): string {
  let iconName: string;
  if (filename === "folder") {
    iconName = "icon-wenjian";
  } else {
    const mimeType = mime.getType(filename);
    if (mimeType) {
      iconName = mapType[mimeType];
    } else {
      iconName = "icon-documents";
    }
  }
  if (!iconName) iconName = "icon-documents";
  return iconName;
}

export function deepEqual(a: any, b: any): boolean {
  if (
    typeof a === "object" &&
    a != null &&
    typeof b === "object" &&
    b != null
  ) {
    // 匹配字段数
    const count = [0, 0];
    count[0] = Object.keys(a).length;
    count[1] = Object.keys(b).length;
    if (count[0] !== count[1]) return false;

    // 键值比较
    if (!Object.keys(a).every(key => key in b && deepEqual(a[key], b[key])))
      return false;
    if (!Object.keys(b).every(key => key in a && deepEqual(a[key], b[key])))
      return false;
    // 比较完成返回成功
    return true;
  }
  return a === b;
}

export function debounce(fn: any, delay = 200) {
  let timer: number | null = null;
  return (...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

export function supportedImage(mimeType: string) {
  // 参见 https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Attributes
  const supportList = [
    "image/apng",
    "image/bmp",
    "image/gif",
    "image/x-icon",
    "image/jpeg",
    "image/png",
    "image/svg+xml",
    "image/tiff",
    "image/webp"
  ];
  return supportList.indexOf(mimeType.toLowerCase()) > 0;
}
