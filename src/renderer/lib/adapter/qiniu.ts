import {ItemType} from "../vdir/types";
import {Adapter} from "./index";

export default class QiniuAdapter implements Adapter {
  adaptItems(items: any[]): ItemType[] {
    return items.map(item => {
      const lastModified = Math.ceil(item.putTime / 1e4);
      const name = (item.key).split('/').pop();
      return {
        name,
        webkitRelativePath: item.key,
        meta: item,
        size: item.fsize,
        type: item.mimeType,
        lastModified,
        lastModifiedDate: new Date(lastModified),
      }
    })
  }
}
