import { IpcRenderer } from "electron";
import { IpcRequest } from "../../../main/IPC/IpcRequest";

export default class IpcService {
  private ipcRenderer?: IpcRenderer;

  private initializeIpcRenderer() {
    if (!window || !window.process || !window.require) {
      throw new Error(`Unable to require renderer process`);
    }
    this.ipcRenderer = window.require("electron").ipcRenderer;
  }

  public send<T>(channel: string, request: IpcRequest = {}): Promise<T> {
    if (!this.ipcRenderer) {
      this.initializeIpcRenderer();
    }
    if (!request.responseChannel) {
      request.responseChannel = `${channel}_response_${new Date().getTime()}`;
    }

    const { ipcRenderer } = this;
    ipcRenderer!.send(channel, request);

    return new Promise(resolve => {
      ipcRenderer!.once(request.responseChannel!, (event, args) => {
        resolve(args);
      });
    });
  }
}
