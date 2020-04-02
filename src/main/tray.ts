import {
  app,
  Menu,
  Tray,
  MenuItem,
  MenuItemConstructorOptions,
  nativeImage,
  NativeImage
} from "electron";
import TrayIcon from "./tray-icon.png";
import { getPlatform } from "../MainWindow/helper/utils";
import { Platform } from "../MainWindow/helper/enums";

export default class AppTray {
  private readonly icon: NativeImage;

  private tray: Tray | null = null;

  constructor() {
    this.icon = nativeImage.createFromDataURL(TrayIcon);
  }

  init() {
    this.tray = new Tray(this.icon);
    /**
     * 现只考虑 windows 平台和 mac 平台
     * 在 windows 上
     * - 显示主页面
     * - 设置
     * - 退出程序
     * 在 mac 上
     * - 显示主页面
     * - 设置
     * - 分割线
     * - 最近传输列表
     * - 分割线
     * - 清空最近记录
     * - 使用 markdown 格式
     * - 退出程序
     */
    const menuTemplate: MenuItemConstructorOptions[] | MenuItem[] = [
      { label: "显示主窗口" },
      { label: "设置" }
    ];
    if (getPlatform() !== Platform.windows) {
      menuTemplate.concat([
        { type: "separator" },
        { label: "最近记录" },
        { type: "separator" },
        { label: "清空最近记录" },
        { label: "使用 markdown 格式" }
      ]);
    }
    menuTemplate.push({
      label: "关闭程序",
      click() {
        app.quit();
      }
    });
    const contextMenu = Menu.buildFromTemplate(menuTemplate);
    this.tray.setToolTip("云存储客户端");
    this.tray.on("click", () => {
      console.log(123123);
    });
    this.tray.setContextMenu(contextMenu);
  }
}
