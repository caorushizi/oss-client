import { injectable } from "inversify";
import { Task } from "../types";
import events from "../helper/events";
import { ITaskRunner } from "../interface";

@injectable()
export default class TaskRunnerService implements ITaskRunner {
  private queue: Task<any>[] = [];

  private active: Task<any>[] = [];

  private limit = 5;

  private debug = false;

  public addTask<T>(task: Task<T>) {
    this.queue.push(task);
    this.runTask();
  }

  private async execute<T>(task: Task<T>) {
    try {
      this.log(`running ${task.id}`);
      await task.result;
      this.log(`task ${task.id} finished`);
      events.emit("transfer-done", task.id);
    } catch (err) {
      this.log(`${task.id} failed`);
      events.emit("transfer-failed", task.id);
    } finally {
      // 处理当前正在活动的任务
      const doneId = this.active.findIndex(i => i.id === task.id);
      this.active.splice(doneId, 1);
      // 处理完成的任务
      this.runTask();
      // 下载完成
      if (this.queue.length === 0 && this.active.length === 0) {
        events.emit("transfer-finish");
      }
    }
  }

  private runTask() {
    while (this.active.length < this.limit && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        this.active.push(task);
        this.execute(task).then(r => r);
      }
    }
  }

  private log(msg: string) {
    if (this.debug) {
      console.info(`[TaskRunner] ${msg}`);
    }
  }
}
