import { BrowserWindow, Tray } from "electron";
import { OssType, Task } from "./types";

export interface IBootstrap {
  start(): void;
}

export interface IApp {
  mainWindow: BrowserWindow | null;
  floatWindow: BrowserWindow | null;
  appTray: Tray | null;
  init(): void;
}

export interface ITaskRunner {
  addTask<T>(task: Task<T>): void;
}

export interface IStore<T> {
  find(query: any): Promise<T[]>;
  insert(doc: T): Promise<T>;
  update(query: any, updateQuery: any, options: any): Promise<void>;
  remove(query: any, options: any): Promise<void>;
}

export interface ILogger {
  info(...params: any[]): void;
  error(...params: any[]): void;
  debug(...params: any[]): void;
  warn(...params: any[]): void;
}

export interface IOSS {
  uploadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: (id: string, progress: string) => void
  ): Promise<any>;
  downloadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: (id: string, progress: string) => void
  ): Promise<any>;
  deleteFile(remotePath: string): Promise<undefined>;
  getBucketList(): Promise<string[]>;
  getBucketFiles(): Promise<any[]>;
  getBucketDomainList(): Promise<string[]>;
  setBucket(bucket: string): void;
}

export interface IOssService {
  getService(): IOSS;
  switchApp(type: OssType, ak: string, sk: string): void;
}
