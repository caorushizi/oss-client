import Item from "./item";
import { ItemType } from "./types";
import { basename, dirname, normalizePath } from "./utils";
import instance from "../../../main/helper/http";

type child = Vdir | Item;
type parent = Vdir | null;

export default class Vdir {
  parent: Vdir | null;

  name: string;

  private children: child[];

  private cursor: Vdir;

  private navigator: string[] = [];

  constructor(name: string, parent: parent = null) {
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
      : vpath.split("/").reduce((prev: Vdir, cur: string) => prev.makeDir(cur), this);
  }

  private makeDir(name: string): Vdir {
    const find = this.children.find(i => i.name === name && i instanceof Vdir);
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
  private touchFile(item: ItemType, r = true): Item {
    const vpath = normalizePath(item.webkitRelativePath);
    const dirPath = dirname(vpath);

    if (r && dirPath !== "") {
      const base = basename(dirPath);
      const dir = this.mkdir(dirPath);
      const file = new Item(item);
      dir.children.push(file);
      return file;
    }
    const file = new Item(item);
    this.children.push(file);
    return file;
  }

  public static from(itemList: ItemType[]): Vdir {
    const dir = new Vdir("#");
    itemList.forEach(item => dir.touchFile(item));
    return dir;
  }

  public listFiles() {
    return this.cursor.children.map(item => ({
      name: item.name,
      type: item instanceof Item ? "file" : "dir"
    }));
  }

  public changeDir(path: string) {
    this.cursor =
      (this.children.find(item => item.name === path && item instanceof Vdir) as Vdir) ||
      this.cursor;
    this.navigator.push(path);
  }

  public back() {
    console.log(this);
    this.cursor = this;
    this.navigator.pop();
  }
}
