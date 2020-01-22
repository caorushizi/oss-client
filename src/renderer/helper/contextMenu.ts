// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcRenderer, remote } from "electron";
import { Item } from "../lib/vdir";

export function fileContextMenu(file: string, vdir: any) {
  const item = vdir.children.find((i: Item) => i.name === file);
  const menu = remote.Menu.buildFromTemplate([
    {
      label: "全选",
      click: f => f
    },
    { type: "separator" },
    {
      label: "复制链接",
      click: f => f
    },
    {
      label: "复制链接（markdown）",
      click: f => f
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
      click: f => f
    }
  ]);
  menu.popup();
}
