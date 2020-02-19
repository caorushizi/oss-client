import { ItemType } from "../vdir/types";
import { Adapter } from "./index";

export const qiniuAdapter: Adapter = (items: any[]): ItemType[] => {
  return items.map(item => {
    const lastModified = Math.ceil(item.putTime / 1e4);
    const name = item.key.split("/").pop();
    return {
      name,
      lastModified,
      webkitRelativePath: item.key,
      meta: item,
      size: item.fsize,
      type: item.mimeType,
      lastModifiedDate: new Date(lastModified)
    };
  });
};
