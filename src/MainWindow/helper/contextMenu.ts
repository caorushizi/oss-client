import { ipcRenderer, remote, clipboard } from "electron";
import VFolder from "../lib/vdir/VFolder";
import VFile from "../lib/vdir/VFile";
import { deleteFile, downloadFile, getConfig, showConfirm } from "./ipc";
import { message } from "antd";

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
      click: async () => {
        const config = await getConfig();
        const protocol = config.useHttps ? "https" : "http";
        const text = `${protocol}://${domain}/${item.webkitRelativePath}`;
        clipboard.writeText(text);
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
      click: async () => {
        await downloadFile(item);
      }
    },
    {
      label: "删除",
      click: async () => {
        try {
          const config = await getConfig();
          const showDialog = config.deleteShowDialog;
          if (showDialog) {
            await showConfirm({ title: "警告", message: "是否要删除该文件" });
          }
          deleteFile(item);
        } catch (e) {
          console.log("删除文件时出错：", e.message);
          message.error(e.message);
        }
      }
    }
  ]);
  menu.popup();
}

export function folderContextMenu(item: VFolder) {}
