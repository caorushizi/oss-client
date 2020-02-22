import { ipcRenderer, remote } from "electron";
import { Ffile } from "../lib/vdir";
import Vdir from "../lib/vdir/vdir";

export function fileContextMenu(item: Ffile) {
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
        ipcRenderer.send("req:file:download", "downloads", item);
      }
    },
    {
      label: "删除",
      click: () => {
        ipcRenderer.send("req:file:delete", "downloads", item);
      }
    }
  ]);
  menu.popup();
}

export function vdirContextMenu(item: Vdir) {}
