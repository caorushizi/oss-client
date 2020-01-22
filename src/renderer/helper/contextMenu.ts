import { ipcRenderer, remote } from "electron";
import { Item } from "../lib/vdir";
import item from "../lib/vdir/item";

export function fileContextMenu(file: string, vdir: any) {
  const item = vdir.children.find((i: Item) => i.name === file);
  const menu = remote.Menu.buildFromTemplate([
    {
      label: "全选",
      click: () => console.log(123123)
    },
    { type: "separator" },
    {
      label: "复制链接",
      click: () => console.log(123123)
    },
    {
      label: "复制链接（markdown）",
      click: () => console.log(123123)
    },
    { type: "separator" },
    {
      label: "下载",
      click: () => {
        ipcRenderer.send("req:file:download", "123", item);
      }
    },
    {
      label: "删除",
      click: () => console.log(123123)
    }
  ]);
  menu.popup();
}
