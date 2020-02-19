import Ffile from "./ffile";
import Vdir from "./vdir";

export type ItemType = {
  name: string;
  webkitRelativePath: string;
  meta: any;
  type: string;
  size: number;
  lastModified: number;
  lastModifiedDate: Date;
};

export type Item = Ffile | Vdir;

export type Parent = Vdir | null;
