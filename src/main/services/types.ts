export interface IObjectStorageService {
  uploadFile(bucketName: string, remotepath: string, filepath: string): Promise<any>;

  downloadFile(bucketName: string, remotepath: string, localpath: string, cb: CallbackFunc): Promise<any>;

  deleteFile(bucketName: string, remotePath: string): Promise<any>;

  getBucketList(): Promise<string[]>;

  getBucketFiles(bucketName: string): Promise<any[]>;

  getBucketDomainList(bucketName: string): Promise<any>;
}

export interface CallbackFunc {
  (id: string, progress: string): void;
}

export enum ObjectStorageServiceType {
  Qiniu,
  Ali,
}
