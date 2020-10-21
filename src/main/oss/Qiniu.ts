import axios from "axios";
import * as fs from "fs";
import qiniu from "qiniu";
import { ReadStream } from "fs";
import shortid from "shortid";
import { IOSS } from "../interface";
import { OssType } from "../types";
import { download } from "../helper/utils";
import VFile from "../../MainWindow/lib/vdir/VFile";

export default class Qiniu implements IOSS {
  private bucket = "";

  private readonly mac: qiniu.auth.digest.Mac;

  private readonly config: qiniu.conf.Config;

  private domains: string[] = [];

  private bucketManager: qiniu.rs.BucketManager;

  private async initDomains() {
    // 1. 获取 domains
    const url = `http://api.qiniu.com/v6/domain/list?tbl=${this.bucket}`;
    const accessToken = qiniu.util.generateAccessToken(this.mac, url);

    const { data } = await axios.get(url, {
      headers: { Authorization: accessToken }
    });
    if (!Array.isArray(data) || data.length <= 0) {
      throw new Error("没有获取到域名");
    }
    this.domains = data;
  }

  constructor(accessKey: string, secretKey: string) {
    this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    this.config = new qiniu.conf.Config();
    this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
  }

  public async downloadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: (id: string, progress: string) => void
  ): Promise<any> {
    if (this.domains.length <= 0) throw new Error("请先初始化存储服务");
    const url = encodeURI(`http://${this.domains[0]}/${remotePath}`);
    return download(url, localPath, p => cb(id, p));
  }

  public uploadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: (id: string, progress: string) => void
  ): Promise<any> {
    // generate uploadToken
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: `${this.bucket}:${remotePath}`
    });
    const token = putPolicy.uploadToken(this.mac);
    const formUploader = new qiniu.form_up.FormUploader(this.config);
    const putExtra = new qiniu.form_up.PutExtra();
    const fileSize = fs.statSync(localPath).size;
    // 文件上传
    return new Promise((resolve, reject) => {
      const reader: ReadStream = fs.createReadStream(localPath);
      let length = 0;
      reader.on("data", (thunk: any) => {
        length += thunk.length;
        const progress = (length / fileSize).toFixed(3);
        cb(id, progress);
      });
      formUploader.putStream(
        token,
        remotePath,
        reader,
        putExtra,
        (err, respBody, respInfo) => {
          if (err) {
            reject(err);
          }
          if (respInfo.statusCode === 200) {
            resolve(respBody);
          } else {
            reject(new Error(respBody.error));
          }
        }
      );
    });
  }

  public deleteFile(remotePath: string): Promise<undefined> {
    const bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
    return new Promise((resolve, reject) => {
      bucketManager.delete(
        this.bucket,
        remotePath,
        (err, respBody, respInfo) => {
          if (err) {
            reject(err);
          }
          if (respInfo.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(respBody.error));
          }
        }
      );
    });
  }

  public async getBucketDomainList(): Promise<string[]> {
    const url = `https://api.qiniu.com/v6/domain/list?tbl=${this.bucket}`;
    const accessToken = qiniu.util.generateAccessToken(this.mac, url);
    const options = { headers: { Authorization: accessToken } };
    const { data } = await axios.get<string[]>(url, options);
    return data;
  }

  public async getBucketFiles(): Promise<any[]> {
    const url = `https://rsf.qbox.me/list?bucket=${this.bucket}`;
    const accessToken = qiniu.util.generateAccessToken(this.mac, url);
    const options = { headers: { Authorization: accessToken } };
    const { data } = await axios.get(url, options);
    return data.items.map(this.itemAdapter);
  }

  public async getBucketList(): Promise<string[]> {
    const url = "https://rs.qbox.me/buckets";
    const accessToken = qiniu.util.generateAccessToken(this.mac, url);
    const options = { headers: { Authorization: accessToken } };
    const { data } = await axios.get<string[]>(url, options);
    if (data.length > 0) {
      await this.setBucket(data[0]);
    }
    return data;
  }

  async setBucket(bucket: string): Promise<void> {
    this.bucket = bucket;
    await this.initDomains();
  }

  type: OssType = OssType.qiniu;

  generateUrl(remotePath: string): string {
    if (this.domains.length <= 0) throw new Error("请先初始化云存储");
    return encodeURI(`http://${this.domains[0]}/${remotePath}`);
  }

  itemAdapter = (item: any): VFile => {
    const lastModified = Math.ceil(item.putTime / 1e4);
    const name = item.key.split("/").pop();
    return {
      shortId: shortid(),
      name,
      lastModified,
      webkitRelativePath: item.key,
      meta: item,
      size: item.fsize,
      type: item.mimeType,
      lastModifiedDate: new Date(lastModified)
    };
  };
}
