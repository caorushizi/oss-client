import shortId from "shortid";
import VFile from "./VFile";
import { Item, Parent } from "./types";
import { dirname } from "./utils";

export default class VFolder {
  parent: Parent;

  name: string;

  size = 0;

  lastModified = 0;

  lastModifiedDate = new Date(0);

  shortId = shortId();

  private children: Item[];

  private cursor: VFolder;

  private navigator: string[] = [];

  constructor(name: string, parent: Parent = null) {
    this.name = name;
    this.parent = parent;
    this.children = [];

    this.cursor = this;
  }

  public static from(itemList: BucketItem[]): VFolder {
    const dir = new VFolder("#");
    itemList.forEach(item => dir.touchFile(item));
    return dir;
  }

  static isDir(o: any) {
    return o instanceof VFolder;
  }

  public listFiles(): Item[] {
    return this.cursor.children;
  }

  public changeDir(path: string) {
    this.cursor =
      (this.cursor.children.find(
        item => item.name === path && VFolder.isDir(item)
      ) as VFolder) || this.cursor;
    this.navigator.push(path);
  }

  public back() {
    if (this.cursor.parent) {
      this.navigator.pop();
      this.cursor = this.cursor.parent;
    }
  }

  public getNav() {
    return this.navigator;
  }

  public getPathPrefix(): string {
    return this.navigator.join("/");
  }

  public getTotalItem(): number {
    return this.cursor.children.length;
  }

  public getItem(fileId: string): Item | undefined {
    return this.cursor.children.find(item => item.shortId === fileId);
  }

  public getItems() {
    return this.cursor.children;
  }

  /**
   * 创建文件夹
   * @param vpath 以 '/' 分割，文件夹路径。
   */
  private mkdir(vpath: string) {
    return vpath === ""
      ? this
      : vpath
          .split("/")
          .reduce((prev: VFolder, cur: string) => prev.makeDir(cur), this);
  }

  private makeDir(name: string): VFolder {
    const find = this.children.find(i => i.name === name && VFolder.isDir(i));
    if (find) return find as VFolder;

    const dir = new VFolder(name, this);
    this.children.push(dir);
    return dir;
  }

  /**
   * 返回一个 item
   * @param item 对于根目录的相对路径，第一个字符不是 .
   * @param r 是否递归创建， false 直接以 vpath 为 name 创建文件
   */
  private touchFile(item: BucketItem, r = true): VFile {
    const vpath = item.webkitRelativePath;
    const dirPath = dirname(vpath);

    let cursor: VFolder;
    if (r && dirPath !== "") {
      // const base = basename(dirPath);
      cursor = this.mkdir(dirPath);
    } else {
      cursor = this;
    }
    const file = new VFile(item);
    // 计算文件夹大小、修改时间
    cursor.size += file.size || 0;
    if (cursor.lastModified < file.lastModified) {
      cursor.lastModified = file.lastModified;
      cursor.lastModifiedDate = new Date(cursor.lastModified);
    }

    cursor.children.push(file);
    return file;
  }
}
