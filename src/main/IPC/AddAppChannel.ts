import { IpcMainEvent } from "electron";
import { IpcChannelInterface } from "./IpcChannelInterface";
import { IpcRequest } from "./IpcRequest";
import { addApp } from "../store/apps";

export class AddAppChannel implements IpcChannelInterface {
  getName = (): string => "add-app";

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    if (!request.responseChannel) {
      request.responseChannel = `${this.getName()}_response`;
    }

    const { name, ak, sk, type } = request.params;
    const app = await addApp(name, type, ak, sk);

    event.sender.send(request.responseChannel, app);
  }
}
