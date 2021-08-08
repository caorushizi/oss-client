export interface IOssService extends Oss {
  uploadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: (id: string, progress: number) => void
  ): Promise<any>;

  downloadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: (id: string, progress: number) => void
  ): Promise<any>;

  deleteFile(remotePath: string): Promise<undefined>;

  getBucketList(): Promise<string[]>;

  getBucketFiles(): Promise<any[]>;

  getBucketDomainList(): Promise<string[]>;

  setBucket(bucket: string): Promise<void>;

  generateUrl(remotePath: string): string;

  itemAdapter(item: any): VFile;
}
