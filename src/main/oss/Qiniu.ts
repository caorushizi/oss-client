import axios, { AxiosResponse } from "axios";
import * as fs from "fs";
import qiniu from "qiniu";
import { ReadStream } from "fs";
import http from "../helper/http";
import { IOSS } from "../interface";

export default class Qiniu implements IOSS {
  private bucket = "";

  private readonly mac: qiniu.auth.digest.Mac;

  private readonly config: qiniu.conf.Config;

  private bucketManager: qiniu.rs.BucketManager;

  constructor(accessKey: string, secretKey: string) {
    this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    this.config = new qiniu.conf.Config({
      zone: qiniu.zone.Zone_z0
    });
    this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
  }

  public downloadFile(
    id: string,
    remotePath: string,
    localPath: string,
    cb: (id: string, progress: string) => void
  ): Promise<any> {
    // 获取 domains
    const url = `http://api.qiniu.com/v6/domain/list?tbl=${this.bucket}`;
    const accessToken = qiniu.util.generateAccessToken(this.mac, url);
    return http
      .get(url, { headers: { Authorization: accessToken } })
      .then((data: any) => {
        if (!Array.isArray(data) || data.length <= 0) {
          throw new Error("没有获取到域名");
        }
        const thisurl = encodeURI(`http://${data[0]}/${remotePath}`);
        return axios.get(thisurl, {
          responseType: "stream",
          headers: { "Cache-Control": "no-cache" }
        });
      })
      .then((rep: AxiosResponse) => {
        const { data, headers } = rep;
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
    // 获取文件大小
    return new Promise<number>((resolve, reject) => {
      fs.stat(localPath, (error, stats) => {
        if (error) {
          reject(new Error("获取文件大小失败"));
        } else {
          // 文件大小
          resolve(stats.size);
        }
      });
    }).then(fileSize => {
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

  public getBucketDomainList(): Promise<string[]> {
    const url = `https://api.qiniu.com/v6/domain/list?tbl=${this.bucket}`;
    const accessToken = qiniu.util.generateAccessToken(this.mac, url);
    const options = { headers: { Authorization: accessToken } };
    return axios.get<string[]>(url, options).then(({ data }) => data);
  }

  public getBucketFiles(): Promise<any[]> {
    const url = `https://rsf.qbox.me/list?bucket=${this.bucket}`;
    const accessToken = qiniu.util.generateAccessToken(this.mac, url);
    const options = { headers: { Authorization: accessToken } };
    return http.get(url, options).then((result: any) => {
      return result.items;
    });
  }

  public getBucketList(): Promise<string[]> {
    const url = "https://rs.qbox.me/buckets";
    const accessToken = qiniu.util.generateAccessToken(this.mac, url);
    const options = { headers: { Authorization: accessToken } };
    return axios.get<string[]>(url, options).then(({ data }) => {
      if (data.length > 0) {
        this.setBucket(data[0]);
      }
      return data;
    });
  }

  setBucket(bucket: string): void {
    this.bucket = bucket;
  }
}
