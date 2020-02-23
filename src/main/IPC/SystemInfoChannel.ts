import { IpcMainEvent } from "electron";
import { execSync } from "child_process";
import { IpcChannelInterface } from "./IpcChannelInterface";
import { IpcRequest } from "./IpcRequest";

export class SystemInfoChannel implements IpcChannelInterface {
  getName = (): string => "system-info";

  handle(event: IpcMainEvent, request: IpcRequest): void {
    if (!request.responseChannel) {
      request.responseChannel = `${this.getName()}_response`;
    }

    event.sender.send(request.responseChannel, {
      kernel: execSync("uname -a").toString()
    });
  }
}
