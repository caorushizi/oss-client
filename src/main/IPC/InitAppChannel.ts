import { IpcMainEvent } from "electron";
import { IpcChannelInterface } from "./IpcChannelInterface";
import { IpcRequest } from "./IpcRequest";
import { getApps } from "../store/apps";
import { initConfig } from "../bootstrap/config";
import { configStore } from "../store/config";
import AppInstance from "../instance";
import { initApp } from "../bootstrap/apps";

export class InitAppChannel implements IpcChannelInterface {
  getName = (): string => "init-app";

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    if (!request.responseChannel) {
      request.responseChannel = `${this.getName()}_response`;
    }

    try {
      // 获取当前的app
      await initConfig();
      const currentAppId = configStore.get("currentApp");
      if (!currentAppId) {
        // 当前没有选中的 app
        // 开始查询所有的apps
        const apps = await getApps();
        // 并将第一个 app 选中
        if (apps.length > 0) {
          const firstApp = apps[0];
          configStore.set("currentApp", firstApp._id);
          AppInstance.changeApp(firstApp.type, firstApp.ak, firstApp.sk);
        }
      } else {
        const currentApp = await initApp(currentAppId);
        AppInstance.changeApp(currentApp.type, currentApp.ak, currentApp.sk);
      }
    } catch (e) {
      console.error(e);
    } finally {
      event.sender.send(request.responseChannel, "success");
    }
  }
}
