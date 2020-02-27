import { IpcMainEvent } from "electron";
import { IpcChannelInterface } from "./IpcChannelInterface";
import { IpcRequest } from "./IpcRequest";
import { getApps } from "../store/apps";

export class GetAppsChannel implements IpcChannelInterface {
  getName = (): string => "get-apps";

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    if (!request.responseChannel) {
      request.responseChannel = `${this.getName()}_response`;
    }

    const apps = await getApps();

    event.sender.send(request.responseChannel, apps);
  }
}
