import { IpcMainEvent } from "electron";
import { IpcChannelInterface } from "./IpcChannelInterface";
import { IpcRequest } from "./IpcRequest";
import AppInstance from "../instance";
import { getTransfers } from "../store/transfers";

export class GetTransfersChannel implements IpcChannelInterface {
  getName = (): string => "get-transfer";

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    if (!request.responseChannel) {
      request.responseChannel = `${this.getName()}_response`;
    }

    try {
      const transfers = await getTransfers();
      event.sender.send(request.responseChannel, transfers);
    } catch (e) {
      event.sender.send(request.responseChannel, []);
    }
  }
}
