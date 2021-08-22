import * as fs from "fs";
import { ReadStream } from "fs";
// @ts-ignore
import COS from "cos-nodejs-sdk-v5";
import mime from "mime";
import shortid from "shortid";
import { IOSS } from "../interface";
import { OssType } from "types/enum";
import { download } from "../helper/utils";
import { VFile } from "types/common";

export default class Tencent implements IOSS {
  appId: string;
  type: OssType = OssType.tencent;
  private bucket = "";
  private readonly accessKey: string;
  private readonly secretKey: string;
  private region = "ap-nanjing";
  private cos: COS;

  constructor(accessKey: string, secretKey: string) {
    this.appId = accessKey;
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.cos = new COS({
      SecretId: this.accessKey,
      SecretKey: this.secretKey,
    });
  }

  public async downloadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: (id: string, progress: number) => void
  ): Promise<any> {
    const url = this.cos.getObjectUrl(
      {
        Bucket: this.bucket,
        Region: this.region,
        Key: remotePath,
      },
      // @ts-ignore
      {}
    );

    return download(url, localPath, (p) => cb(id, p));
  }

  public async uploadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: (id: string, progress: number) => void
  ): Promise<any> {
    const fileSize = fs.statSync(localPath).size;
    const reader: ReadStream = fs.createReadStream(localPath);
    let length = 0;
    reader.on("data", (thunk: any) => {
      length += thunk.length;
      const progress = Math.ceil((length / fileSize) * 100);
      cb(id, progress);
    });
    return new Promise((resolve, reject) => {
      this.cos.putObject(
        {
          Bucket: this.bucket /* 必须 */,
          Region: this.region /* 必须 */,
          Key: remotePath /* 必须 */,
          Body: reader, // 上传文件对象
        },
        (err: any, data: any) => {
          if (err) reject(err);
          resolve(data);
        }
      );
    });
  }

  // fixme: 阿里云获取存储空间域名

  public async deleteFile(remotePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.cos.deleteObject(
        {
          Bucket: "examplebucket-1250000000" /* 必须 */,
          Region: "COS_REGION" /* 必须 */,
          Key: "exampleobject" /* 必须 */,
        },
        (err: any, data: any) => {
          if (err) reject(err);
          resolve(data);
        }
      );
    });
  }

  // eslint-disable-next-line class-methods-use-this
  public async getBucketDomainList(): Promise<string[]> {
    return [];
  }

  public async getBucketFiles(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.cos.getBucket(
        {
          Bucket: this.bucket,
          Region: this.region,
        },
        (err: any, data: any) => {
          if (err) reject(err);
          resolve(data.Contents.map(this.itemAdapter));
        }
      );
    });
  }

  public async getBucketList(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      this.cos.getService((err: any, data: any) => {
        if (err) reject(err);
        resolve(data.Buckets.map((item: any) => item.Name));
      });
    });
  }

  async setBucket(bucket: string): Promise<void> {
    this.bucket = bucket;
  }

  generateUrl(remotePath: string): string {
    // @ts-ignore
    return this.cos.getObjectUrl({
      Bucket: this.bucket,
      Region: this.region,
      Key: remotePath,
    });
  }

  itemAdapter = (item: any): VFile => {
    const name = item.Key.split("/").pop();

    return {
      shortId: shortid(),
      name,
      lastModified: item.LastModified,
      webkitRelativePath: item.Key,
      meta: item,
      size: item.Size,
      type: mime.getType(name) || "",
      lastModifiedDate: new Date(item.lastModified),
    };
  };
}
