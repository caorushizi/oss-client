import axios from "axios";
import * as fs from "fs";
import { ReadStream } from "fs";
import OSS from "ali-oss";
import { IOSS } from "../interface";
import { OssType } from "../types";

export default class Ali implements IOSS {
  private bucket = "";

  private readonly accessKey: string;

  private readonly secretKey: string;

  constructor(accessKey: string, secretKey: string) {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
  }

  private createStore() {
    return new OSS({
      accessKeyId: this.accessKey,
      accessKeySecret: this.secretKey,
      bucket: this.bucket
    });
  }

  public async downloadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: (id: string, progress: string) => void
  ): Promise<any> {
    const store = this.createStore();
    const url = store.signatureUrl(remotePath);
    console.log(url);
    // 获取 domains
    return axios
      .get(url, {
        responseType: "stream",
        headers: { "Cache-Control": "no-cache" }
      })
      .then(({ data, headers }) => {
        return new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(localPath);
          data.pipe(writer);
          let length = 0;
          const totalLength = headers["content-length"];
          data.on("data", (thunk: any) => {
            length += thunk.length;
            const process = (length / totalLength).toFixed(3);
            cb(id, process);
          });
          writer.on("finish", resolve);
          writer.on("error", reject);
        });
      });
  }

  public async uploadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: (id: string, progress: string) => void
  ): Promise<any> {
    const store = this.createStore();
    const fileSize = fs.statSync(localPath).size;
    const reader: ReadStream = fs.createReadStream(localPath);

    let length = 0;
    reader.on("data", (thunk: any) => {
      length += thunk.length;
      const progress = (length / fileSize).toFixed(3);
      cb(id, progress);
    });
    return store.putStream(remotePath, reader);
  }

  public async deleteFile(remotePath: string): Promise<any> {
    const store = this.createStore();
    return store.delete(remotePath);
  }

  // fixme: 阿里云获取存储空间域名
  // eslint-disable-next-line class-methods-use-this
  public async getBucketDomainList(): Promise<string[]> {
    return [];
  }

  public async getBucketFiles(): Promise<any[]> {
    // oss-cn-beijing.aliyuncs.com
    const store = new OSS({
      region: "oss-cn-beijing",
      accessKeyId: this.accessKey,
      accessKeySecret: this.secretKey,
      bucket: this.bucket
    });
    const result = await store.list(null, { timeout: 1000 });
    return result.objects || [];
  }

  public async getBucketList(): Promise<string[]> {
    const store = new OSS({
      accessKeyId: this.accessKey,
      accessKeySecret: this.secretKey
    });
    const result = (await store.listBuckets({})) as any;
    return result.buckets.map((item: any) => item.name);
  }

  setBucket(bucket: string): void {
    this.bucket = bucket;
  }

  type: OssType = OssType.ali;
}
