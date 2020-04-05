import { IpcMainEvent } from "electron";
import { IpcChannelInterface } from "./IpcChannelInterface";
import { IpcRequest } from "./IpcRequest";
import { deleteApp } from "../store/apps";
import { getRecentUploadList } from "../store/transfers";
import { TransferStore } from "../types";

export class GetUploadTransfersChannel implements IpcChannelInterface {
  getName = (): string => "get-recent-transfer-list";

  async handle(event: IpcMainEvent, request: IpcRequest) {
    if (!request.responseChannel) {
      request.responseChannel = `${this.getName()}_response`;
    }

    const recentStoreList = await getRecentUploadList();

    event.sender.send(request.responseChannel, recentStoreList);
  }
}
