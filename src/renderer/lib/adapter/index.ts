import {ItemType} from "../vdir/types";

export interface Adapter {
  adaptItems(data: any): ItemType[]
}
