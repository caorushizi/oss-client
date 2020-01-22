export function normalizePath(strPath: string): string {
  return strPath
    .replace(/\\+/g, "/")
    .replace(/\/\//, "/")
    .replace(/^\//, "")
    .replace(/\/$/, "");
}

export function dirname(strPath: string) {
  const pathArr = strPath.split("/");
  return pathArr.splice(0, pathArr.length - 1).join("/");
}

export function basename(strPath: string): string {
  const index = strPath.lastIndexOf("/");
  return strPath.substr(index + 1);
}

// TODO：使用正则表达式
