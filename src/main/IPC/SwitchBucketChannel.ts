import { IpcMainEvent } from "electron";
import { IpcChannelInterface } from "./IpcChannelInterface";
import { IpcRequest } from "./IpcRequest";
import AppInstance from "../instance";

export class SwitchBucketChannel implements IpcChannelInterface {
  getName = (): string => "switch-bucket";

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    if (!request.responseChannel) {
      request.responseChannel = `${this.getName()}_response`;
    }

    const instance = AppInstance.getInstance();
    const { oss } = instance;
    oss.setBucket(request.params);
    const files = await oss.getBucketFiles();
    const domains = await oss.getBucketDomainList();

    event.sender.send(request.responseChannel, { files, domains });
  }
}
