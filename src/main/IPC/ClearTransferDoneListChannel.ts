import { IpcMainEvent } from "electron";
import { IpcChannelInterface } from "./IpcChannelInterface";
import { IpcRequest } from "./IpcRequest";
import { clearTransferDoneList } from "../store/transfers";

export class ClearTransferDoneListChannel implements IpcChannelInterface {
  getName = (): string => "clear-transfer-done-list";

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    if (!request.responseChannel) {
      request.responseChannel = `${this.getName()}_response`;
    }

    await clearTransferDoneList();

    event.sender.send(request.responseChannel);
  }
}
