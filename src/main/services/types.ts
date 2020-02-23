export interface IObjectStorageService {
  uploadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: CallbackFunc
  ): Promise<any>;

  downloadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: CallbackFunc
  ): Promise<any>;

  deleteFile(remotePath: string): Promise<undefined>;

  getBucketList(): Promise<string[]>;

  getBucketFiles(): Promise<any[]>;

  getBucketDomainList(): Promise<string[]>;

  setBucket(bucket: string): void;
}

export interface CallbackFunc {
  (id: string, progress: string): void;
}
