import axios, {AxiosResponse} from 'axios';
import * as fs from 'fs';
import qiniu from 'qiniu';
import http from '../../helper/http';
import {CallbackFunc, IObjectStorageService} from '../types';

// todo: http 与 axios
export default class Qiniu implements IObjectStorageService {
  private mac: qiniu.auth.digest.Mac;
  // private domains: string[];
  private config: qiniu.conf.Config;
  private bucketManager: qiniu.rs.BucketManager;

  constructor(accessKey: string, secretKey: string) {
    this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    this.config = new qiniu.conf.Config({
      zone: qiniu.zone.Zone_z0,
    });
    this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
  }

  public downloadFile(bucketName: string, remotePath: string, localpath: string, cb: CallbackFunc): Promise<any> {
    // 获取 domains
    const url = `http://api.qiniu.com/v6/domain/list?tbl=${bucketName}`;
    const accessToken = qiniu.util.generateAccessToken(this.mac, url);
    return http.get(url, {headers: {Authorization: accessToken}})
      .then((data: any) => {
        debugger
        if (!Array.isArray(data) || data.length <= 0) {
          throw new Error('没有获取到域名');
        }
        const url = encodeURI(`http://${data[0]}/${remotePath}`);
        // todo： 测试是不是流式下载，性能优化
        return axios.get(url, {
          responseType: 'stream',
          headers: {'Cache-Control': 'no-cache'},
        });
      })
      .then((rep: AxiosResponse) => {
        const {data, headers} = rep;
        return new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(localpath);
          data.pipe(writer);
          let length = 0;
          const totalLength = headers['content-length'];
          data.on('data', (thunk: any) => {
            length = length + thunk.length;
            console.log('thunk progress: ', length / totalLength);
          });
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
      });
  }

  public uploadFile(bucketName: string, remotePath: string, filePath: string): Promise<any> {
    // generate uploadToken
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: `${bucketName}:${remotePath}`,
    });
    const token = putPolicy.uploadToken(this.mac);
    const formUploader = new qiniu.form_up.FormUploader(this.config);
    const putExtra = new qiniu.form_up.PutExtra();
    // 文件上传
    return new Promise((resolve, reject) => {
      formUploader.putFile(token, remotePath, filePath, putExtra,
        (err, respBody, respInfo) => {
          if (err) {
            reject(err);
          } else {
            if (respInfo.statusCode === 200) {
              console.log(respBody);
            } else {
              console.log(respInfo.statusCode);
              console.log(respBody);
            }
          }
        });
    });
  }

  public deleteFile(bucketName: string, remotePath: string): Promise<any> {
    const config = new qiniu.conf.Config();
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config);
    return new Promise((resolve, reject) => {
      bucketManager.delete(bucketName, remotePath, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
        } else {
          resolve({respBody, respInfo});
        }
      });
    });
  }

  public getBucketDomainList(bucketName: string): Promise<any> {
    const url = `https://api.qiniu.com/v6/domain/list?tbl=${bucketName}`;
    const accessToken = qiniu.util.generateAccessToken(this.mac, url);
    const options = {headers: {Authorization: accessToken}};
    return http.get(url, options);
  }

  public getBucketFiles(bucketName: string): Promise<any[]> {
    const url = `https://rsf.qbox.me/list?bucket=${bucketName}`;
    const accessToken = qiniu.util.generateAccessToken(this.mac, url);
    const options = {headers: {Authorization: accessToken}};
    return http.get(url, options);
  }

  public getBucketList(): Promise<string[]> {
    const url = 'https://rs.qbox.me/buckets';
    const accessToken = qiniu.util.generateAccessToken(this.mac, url);
    const options = {headers: {Authorization: accessToken}};
    return http.get(url, options);
  }

}
