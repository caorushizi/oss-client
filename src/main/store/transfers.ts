import DataStore from "nedb";
import * as path from "path";
import { TaskType, TransferStatus, TransferStore } from "../types";
import { appDir } from "../helper/dir";

const filename = path.join(appDir, "transfers");
const transferStore = new DataStore<TransferStore | TransferStore[]>({
  filename,
  autoload: true
});

export function getTransfers(): Promise<TransferStore[]> {
  return new Promise((resolve, reject) => {
    transferStore.find<TransferStore>({}, (err, documents) => {
      if (err) reject(err);
      resolve(documents);
    });
  });
}

export function insertTransfer(doc: TransferStore): Promise<TransferStore> {
  return new Promise((resolve, reject) => {
    transferStore.insert<TransferStore>(doc, (err, document) => {
      if (err) reject(err);
      resolve(document);
    });
  });
}

export function transferDone(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    transferStore.update<TransferStore>(
      { id },
      { $set: { status: TransferStatus.done } },
      {},
      (err, numberOfUpdated) => {
        if (err) reject(err);
        resolve();
      }
    );
  });
}

export function transferFailed(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    transferStore.update<TransferStore>(
      { id },
      { $set: { status: TransferStatus.failed } },
      {},
      (err, numberOfUpdated) => {
        if (err) reject(err);
        resolve();
      }
    );
  });
}

export function clearTransferDoneList() {
  return new Promise((resolve, reject) => {
    transferStore.remove(
      { status: TransferStatus.done },
      { multi: true },
      (err, n) => {
        if (err) reject(err);
        resolve();
      }
    );
  });
}

export function getRecentUploadList(): Promise<TransferStore[]> {
  return new Promise((resolve, reject) => {
    transferStore.find(
      { type: TaskType.upload },
      (err, documents: TransferStore[]) => {
        if (err) reject(err);
        resolve(documents);
      }
    );
  });
}
