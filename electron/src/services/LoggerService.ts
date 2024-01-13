import log from "electron-log";
import { injectable } from "inversify";
import { ILogger } from "../interface";

@injectable()
export default class LoggerService implements ILogger {
  private logger = log;

  debug(...params: any[]): void {
    this.logger.debug(params);
  }

  error(...params: any[]): void {
    this.logger.error(params);
  }

  info(...params: any[]): void {
    this.logger.info(params);
  }

  warn(...params: any[]): void {
    this.logger.warn(params);
  }
}
