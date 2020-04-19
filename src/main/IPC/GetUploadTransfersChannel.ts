import { IpcMainEvent } from "electron";
import { IpcChannelInterface } from "./IpcChannelInterface";
import { IpcRequest } from "./IpcRequest";
import { getRecentUploadList } from "../store/transfers";

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
