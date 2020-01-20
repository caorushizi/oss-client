export interface IObjectStorageService {
  uploadFile(bucketName: string, remotePath: string, filePath: string): Promise<any>;

  downloadFile(bucketName: string, remotePath: string): Promise<any>;

  deleteFile(bucketName: string, remotePath: string): Promise<any>;

  getBucketList(): Promise<string[]>;

  getBucketFiles(bucketName: string): Promise<any[]>;

  getBucketDomainList(bucketName: string): Promise<any>;
}

export enum ObjectStorageServiceType {
  Qiniu,
  Ali,
}
