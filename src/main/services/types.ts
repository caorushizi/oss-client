export interface IObjectStorageService {
  uploadFile(bucketName: string, remotepath: string, filepath: string): Promise<any>;

  downloadFile(bucketName: string, remotepath: string, localpath: string): Promise<any>;

  deleteFile(bucketName: string, remotePath: string): Promise<any>;

  getBucketList(): Promise<string[]>;

  getBucketFiles(bucketName: string): Promise<any[]>;

  getBucketDomainList(bucketName: string): Promise<any>;
}

export enum ObjectStorageServiceType {
  Qiniu,
  Ali,
}
