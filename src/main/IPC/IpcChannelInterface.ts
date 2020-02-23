import { IpcMainEvent } from "electron";
import { IpcRequest } from "./IpcRequest";

export interface IpcChannelInterface {
  getName(): string;

  handle(event: IpcMainEvent, request: IpcRequest): void;
}
