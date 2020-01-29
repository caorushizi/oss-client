export interface IObjectStorageService {
  uploadFile(remotePath: string, localPath: string, cb: CallbackFunc): Promise<any>;

  downloadFile(remotePath: string, localPath: string, cb: CallbackFunc): Promise<any>;

  deleteFile(remotePath: string): Promise<any>;

  getBucketList(): Promise<string[]>;

  getBucketFiles(): Promise<any[]>;

  getBucketDomainList(): Promise<string[]>;

  setBucket(bucket: string): void;
}

export interface CallbackFunc {
  (id: string, progress: string): void;
}

export enum ObjectStorageServiceType {
  Qiniu,
  Ali
}
