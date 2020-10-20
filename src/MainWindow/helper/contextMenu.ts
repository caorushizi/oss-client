import { remote, clipboard } from "electron";
import { message } from "antd";
import VFolder from "../lib/vdir/VFolder";
import VFile from "../lib/vdir/VFile";
import {
  deleteFile,
  downloadFile,
  getConfig,
  getFileUrl,
  showConfirm
} from "./ipc";

export function fileContextMenu(item: VFile) {
  const menu = remote.Menu.buildFromTemplate([
    {
      label: "全选",
      click: f => f
    },
    { type: "separator" },
    {
      label: "复制链接",
      click: async () => {
        const url = await getFileUrl(item.webkitRelativePath);
        clipboard.writeText(url);
      }
    },
    {
      label: "复制链接（markdown）",
      click: async () => {
        const url = await getFileUrl(item.webkitRelativePath);
        clipboard.writeText(`![${item.name}]("${url}")`);
      }
    },
    { type: "separator" },
    {
      label: "下载",
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
          await deleteFile(item.webkitRelativePath);
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
