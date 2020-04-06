import { IpcMainEvent } from "electron";
import { IpcChannelInterface } from "./IpcChannelInterface";
import { IpcRequest } from "./IpcRequest";
import { configStore } from "../store/config";

export class GetConfigChannel implements IpcChannelInterface {
  getName = (): string => "get-config";

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    if (!request.responseChannel) {
      request.responseChannel = `${this.getName()}_response`;
    }

    const config = configStore.store;

    event.sender.send(request.responseChannel, config);
  }
}
