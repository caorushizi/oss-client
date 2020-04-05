import { ipcRenderer, remote, clipboard } from "electron";
import VFolder from "../lib/vdir/VFolder";
import VFile from "../lib/vdir/VFile";

export function fileContextMenu(item: VFile, domain: string) {
  const menu = remote.Menu.buildFromTemplate([
    {
      label: "全选",
      click: f => f
    },
    { type: "separator" },
    {
      label: "复制链接",
      enabled: !!domain,
      click: () => {
        clipboard.writeText(`http://${domain}/${item.webkitRelativePath}`);
      }
    },
    {
      label: "复制链接（markdown）",
      enabled: !!domain,
      click: () => {
        const link = `http://${domain}/${item.webkitRelativePath}`;
        clipboard.writeText(`![${item.name}]("${link}")`);
      }
    },
    { type: "separator" },
    {
      label: "下载",
      enabled: !!domain,
      click: () => {
        ipcRenderer.send("req:file:download", item);
      }
    },
    {
      label: "删除",
      click: () => {
        remote.dialog
          .showMessageBox({
            type: "question",
            message: "是否要删除这个文件",
            buttons: ["取消", "确定"],
            defaultId: 1,
            cancelId: 0
          })
          .then(({ response }) => {
            if (response === 1) {
              ipcRenderer.send("req:file:delete", item);
            }
          });
      }
    }
  ]);
  menu.popup();
}

export function folderContextMenu(item: VFolder) {}
