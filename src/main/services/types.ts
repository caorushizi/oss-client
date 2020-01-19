export interface IObjectStorageService {
  uploadFile(bucketName: string, key: string, filePath: string): Promise<any>;

  downloadFile(bucketName: string, key: string): Promise<any>;

  deleteFile(bucketName: string, key: string): Promise<any>;

  getBucketList(): Promise<string[]>;

  getBucketFiles(bucketName: string): Promise<any[]>;

  getBucketDomainList(bucketName: string): Promise<any>;
}

export enum ObjectStorageServiceType {
  Qiniu,
  Ali,
}
