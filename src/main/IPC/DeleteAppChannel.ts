import { IpcMainEvent } from "electron";
import { IpcChannelInterface } from "./IpcChannelInterface";
import { IpcRequest } from "./IpcRequest";
import { deleteApp } from "../store/apps";

export class DeleteAppChannel implements IpcChannelInterface {
  getName = (): string => "delete-app";

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    if (!request.responseChannel) {
      request.responseChannel = `${this.getName()}_response`;
    }

    const app = request.params;
    await deleteApp(app);

    event.sender.send(request.responseChannel);
  }
}
