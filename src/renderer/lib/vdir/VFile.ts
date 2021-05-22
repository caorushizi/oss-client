import shortId from "shortid";
import { BucketItem } from "types/renderer";

export default class VFile {
  name: string;

  webkitRelativePath: string;

  meta: any;

  type: string;

  size = 0;

  lastModified = 0;

  lastModifiedDate = new Date();

  shortId = shortId();

  constructor({
    name,
    webkitRelativePath,
    meta,
    type,
    size,
    lastModified,
    lastModifiedDate,
  }: BucketItem) {
    this.name = name;
    this.type = type;
    this.size = size;
    this.lastModified = lastModified;
    this.lastModifiedDate = lastModifiedDate;
    this.webkitRelativePath = webkitRelativePath;
    this.meta = meta;
  }
}
