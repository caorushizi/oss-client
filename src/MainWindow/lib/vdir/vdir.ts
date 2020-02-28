import Ffile from "./ffile";
import { Item, ItemType, Parent } from "./types";
import { dirname, normalizePath } from "./utils";

export default class Vdir {
  parent: Parent;

  name: string;

  size = 0;

  lastModified = 0;

  lastModifiedDate = new Date(0);

  private children: Item[];

  private cursor: Vdir;

  private navigator: string[] = [];

  constructor(name: string, parent: Parent = null) {
    this.name = name;
    this.parent = parent;
    this.children = [];

    this.cursor = this;
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
          .reduce((prev: Vdir, cur: string) => prev.makeDir(cur), this);
  }

  private makeDir(name: string): Vdir {
    const find = this.children.find(i => i.name === name && Vdir.isDir(i));
    if (find) return find as Vdir;

    const dir = new Vdir(name, this);
    this.children.push(dir);
    return dir;
  }

  /**
   * 返回一个 item
   * @param item 对于根目录的相对路径，第一个字符不是 .
   * @param r 是否递归创建， false 直接以 vpath 为 name 创建文件
   */
  private touchFile(item: ItemType, r = true): Ffile {
    const vpath = normalizePath(item.webkitRelativePath);
    const dirPath = dirname(vpath);

    let cursor: Vdir;
    if (r && dirPath !== "") {
      // const base = basename(dirPath);
      cursor = this.mkdir(dirPath);
    } else {
      cursor = this;
    }
    const file = new Ffile(item);
    // 计算文件夹大小、修改时间
    cursor.size += file.size || 0;
    if (cursor.lastModified < file.lastModified) {
      cursor.lastModified = file.lastModified;
      cursor.lastModifiedDate = new Date(cursor.lastModified);
    }

    cursor.children.push(file);
    return file;
  }

  public static from(itemList: ItemType[]): Vdir {
    const dir = new Vdir("#");
    itemList.forEach(item => dir.touchFile(item));
    return dir;
  }

  public listFiles(): Item[] {
    return this.cursor.children;
  }

  public changeDir(path: string) {
    this.cursor =
      (this.cursor.children.find(
        item => item.name === path && Vdir.isDir(item)
      ) as Vdir) || this.cursor;
    this.navigator.push(path);
  }

  public back() {
    if (this.cursor.parent) {
      this.navigator.pop();
      this.cursor = this.cursor.parent;
    }
  }
  // TODO: 返回某一个文件夹

  public getNav() {
    return this.navigator;
  }

  public getPathPrefix(): string {
    // todo ： 对 // \\ 处理
    return `${this.navigator.join("/")}/`;
  }

  static isDir(o: any) {
    return o instanceof Vdir;
  }

  public getTotalItem(): number {
    return this.cursor.children.length;
  }
}
