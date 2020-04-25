import { injectable } from "inversify";
import { Task } from "../types";
import events from "../helper/events";
import { ITaskRunner } from "../interface";

@injectable()
export default class TaskRunnerService implements ITaskRunner {
  private queue: Task<any>[] = [];

  private active: Task<any>[] = [];

  private done: Task<any>[] = [];

  private limit = 5;

  private debug = false;

  public addTask<T>(task: Task<T>) {
    this.queue.push(task);
    this.runTask();
  }

  private execute<T>(task: Task<T>) {
    this.log(`running ${task.id}`);
    return task.result
      .then(result => {
        this.log(`task ${task.id} finished`);
        events.emit("done", task.id);
        return result;
      })
      .catch(error => {
        this.log(`${task.id} failed`);
        events.emit("failed", task.id);
        throw error;
      })
      .then(() => {
        // 处理当前正在活动的任务
        const doneId = this.active.findIndex(i => i.id === task.id);
        const doneTask = this.active.splice(doneId, 1);
        // 处理完成的任务
        this.done.push(...doneTask);
        this.runTask();
        // 下载完成
        if (this.queue.length === 0 && this.active.length === 0) {
          events.emit("finish");
        }
      });
  }

  private runTask() {
    while (this.active.length < this.limit && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        this.active.push(task);
        this.execute(task);
      }
    }
  }

  private log(msg: string) {
    if (this.debug) {
      console.info(`[TaskRunner] ${msg}`);
    }
  }
}
