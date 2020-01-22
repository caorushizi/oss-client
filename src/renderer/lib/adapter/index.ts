import { ItemType } from "../vdir/types";

export interface Adapter {
  (data: any): ItemType[];
}
