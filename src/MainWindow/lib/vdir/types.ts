import VFile from "./VFile";
import VFolder from "./VFolder";

export type ItemType = {
  name: string;
  webkitRelativePath: string;
  meta: any;
  type: string;
  size: number;
  lastModified: number;
  lastModifiedDate: Date;
};

export type Item = VFile | VFolder;

export type Parent = VFolder | null;
