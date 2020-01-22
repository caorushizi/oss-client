import { ItemType } from "./types";

export default class Item {
  name: string;

  webkitRelativePath: string;

  meta: any;

  type?: string;

  size?: number;

  lastModified?: number;

  lastModifiedDate?: Date;

  constructor({
    name,
    webkitRelativePath,
    meta,
    type,
    size,
    lastModified,
    lastModifiedDate
  }: ItemType) {
    this.name = name;
    this.type = type;
    this.size = size;
    this.lastModified = lastModified;
    this.lastModifiedDate = lastModifiedDate;
    this.webkitRelativePath = webkitRelativePath;
    this.meta = meta;
  }
}
