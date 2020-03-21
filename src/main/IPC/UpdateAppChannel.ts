import { IpcMainEvent } from "electron";
import { IpcChannelInterface } from "./IpcChannelInterface";
import { IpcRequest } from "./IpcRequest";
import { updateApp } from "../store/apps";

export class UpdateAppChannel implements IpcChannelInterface {
  getName = (): string => "update-app";

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    if (!request.responseChannel) {
      request.responseChannel = `${this.getName()}_response`;
    }

    const app = request.params;
    await updateApp(app);

    event.sender.send(request.responseChannel);
  }
}
