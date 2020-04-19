import { BrowserWindow, Tray } from "electron";
import { Task } from "./types";

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
