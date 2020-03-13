import { IpcMainEvent } from "electron";
import { IpcChannelInterface } from "./IpcChannelInterface";
import { IpcRequest } from "./IpcRequest";
import { getApps } from "../store/apps";
import AppInstance from "../instance";
import { initApp } from "../bootstrap/apps";

export class InitAppChannel implements IpcChannelInterface {
  getName = (): string => "init-app";

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    if (!request.responseChannel) {
      request.responseChannel = `${this.getName()}_response`;
    }

    try {
      const { id } = request.params;
      if (id) {
        const currentApp = await initApp(id);
        AppInstance.changeApp(currentApp.type, currentApp.ak, currentApp.sk);
      } else {
        // 开始查询所有的apps
        const apps = await getApps();
        // 并将第一个 app 选中
        if (apps.length > 0)
          AppInstance.changeApp(apps[0].type, apps[0].ak, apps[0].sk);
      }
    } finally {
      event.sender.send(request.responseChannel, "success");
    }
  }
}
