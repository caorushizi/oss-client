import { BrowserWindow, Tray } from "electron";
import { OssType, Task } from "./types";
import VFile from "../MainWindow/lib/vdir/VFile";

export interface IApp {
  mainWindow: BrowserWindow | null;
  floatWindow: BrowserWindow | null;
  alertWindow: BrowserWindow | null;
  confirmWindow: BrowserWindow | null;
  appTray: Tray | null;
  init(): void;
}

export interface ITaskRunner {
  addTask<T>(task: Task<T>): void;
  setProgress(id: string, progress: number): void;
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
  type: OssType;
  appId: string;
  uploadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: (id: string, progress: number) => void
  ): Promise<any>;
  downloadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: (id: string, progress: number) => void
  ): Promise<any>;
  deleteFile(remotePath: string): Promise<undefined>;
  getBucketList(): Promise<string[]>;
  getBucketFiles(): Promise<any[]>;
  getBucketDomainList(): Promise<string[]>;
  setBucket(bucket: string): Promise<void>;
  generateUrl(remotePath: string): string;
  itemAdapter(item: any): VFile;
}

export interface IOssService {
  getService(): IOSS;
  changeContext(type: OssType, ak: string, sk: string): void;
  clearContext(): void;
}
