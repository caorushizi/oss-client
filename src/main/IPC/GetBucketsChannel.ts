import { IpcMainEvent } from "electron";
import { IpcChannelInterface } from "./IpcChannelInterface";
import { IpcRequest } from "./IpcRequest";
import AppInstance from "../instance";

export class GetBucketsChannel implements IpcChannelInterface {
  getName = (): string => "get-buckets";

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    if (!request.responseChannel) {
      request.responseChannel = `${this.getName()}_response`;
    }

    try {
      const instance = AppInstance.getInstance();
      const { oss } = instance;
      const buckets = await oss.getBucketList();
      event.sender.send(request.responseChannel, buckets);
    } catch (e) {
      event.sender.send(request.responseChannel, []);
    }
  }
}
