import * as fs from "fs";
import { ReadStream } from "fs";
import OSS from "ali-oss";
import mime from "mime";
import shortid from "shortid";
import { IOSS } from "../interface";
import { OssType } from "../types";
import { download } from "../helper/utils";
import VFile from "../../MainWindow/lib/vdir/VFile";

export default class Ali implements IOSS {
  private bucket = "";

  private readonly accessKey: string;

  private readonly secretKey: string;

  private region = "oss-cn-beijing";

  appId: string;

  constructor(accessKey: string, secretKey: string) {
    this.appId = accessKey;
    this.accessKey = accessKey;
    this.secretKey = secretKey;
  }

  public async downloadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: (id: string, progress: number) => void
  ): Promise<any> {
    const store = new OSS({
      region: this.region,
      accessKeyId: this.accessKey,
      accessKeySecret: this.secretKey,
      bucket: this.bucket
    });
    const url = store.signatureUrl(remotePath);
    return download(url, localPath, p => cb(id, p));
  }

  public async uploadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: (id: string, progress: number) => void
  ): Promise<any> {
    const store = new OSS({
      region: this.region,
      accessKeyId: this.accessKey,
      accessKeySecret: this.secretKey,
      bucket: this.bucket
    });
    const fileSize = fs.statSync(localPath).size;
    const reader: ReadStream = fs.createReadStream(localPath);

    let length = 0;
    reader.on("data", (thunk: any) => {
      length += thunk.length;
      const progress = Math.ceil((length / fileSize) * 100);
      cb(id, progress);
    });
    return store.putStream(remotePath, reader);
  }

  public async deleteFile(remotePath: string): Promise<any> {
    const store = new OSS({
      region: this.region,
      accessKeyId: this.accessKey,
      accessKeySecret: this.secretKey,
      bucket: this.bucket
    });
    return store.delete(remotePath);
  }

  // fixme: 阿里云获取存储空间域名
  // eslint-disable-next-line class-methods-use-this
  public async getBucketDomainList(): Promise<string[]> {
    return [];
  }

  public async getBucketFiles(): Promise<any[]> {
    const store = new OSS({
      region: this.region,
      accessKeyId: this.accessKey,
      accessKeySecret: this.secretKey,
      bucket: this.bucket
    });
    const result = await store.list(null, { timeout: 1000 });
    return result.objects ? result.objects.map(this.itemAdapter) : [];
  }

  public async getBucketList(): Promise<string[]> {
    const store = new OSS({
      accessKeyId: this.accessKey,
      accessKeySecret: this.secretKey
    });
    const result = (await store.listBuckets({})) as any;
    return result.buckets.map((item: any) => item.name);
  }

  async setBucket(bucket: string): Promise<void> {
    this.bucket = bucket;
  }

  type: OssType = OssType.ali;

  generateUrl(remotePath: string): string {
    const client = new OSS({
      region: this.region,
      accessKeyId: this.accessKey,
      accessKeySecret: this.secretKey,
      bucket: this.bucket
    });
    return client.signatureUrl(remotePath);
  }

  itemAdapter = (item: any): VFile => {
    const { name } = item;
    return {
      shortId: shortid(),
      name,
      lastModified: item.lastModified,
      webkitRelativePath: item.name,
      meta: item,
      size: item.size,
      type: mime.getType(item.name) || "",
      lastModifiedDate: new Date(item.lastModified)
    };
  };
}
