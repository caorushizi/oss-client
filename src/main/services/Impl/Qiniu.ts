import qiniu from 'qiniu';
import http from '../../helper/http';
import {IObjectStorageService} from '../types';

export default class Qiniu implements IObjectStorageService {
    private mac: qiniu.auth.digest.Mac;
    private domains: string[];
    private config: qiniu.conf.Config;
    private bucketManager: qiniu.rs.BucketManager;

    constructor(accessKey: string, secretKey: string) {
        this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
        this.config = new qiniu.conf.Config({
            zone: qiniu.zone.Zone_z0,
        });
        this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
    }

    public downloadFile(bucketName: string, key: string): Promise<any> {
        return undefined;
    }

    public uploadFile(bucketName: string, key: string, filePath: string): Promise<any> {
        // generate uploadToken
        const putPolicy = new qiniu.rs.PutPolicy({
            scope: `${bucketName}:${key}`,
        });
        const token = putPolicy.uploadToken(this.mac);
        const formUploader = new qiniu.form_up.FormUploader(this.config);
        const putExtra = new qiniu.form_up.PutExtra();
        // 文件上传
        return new Promise((resolve, reject) => {
            formUploader.putFile(token, key, filePath, putExtra,
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

    public deleteFile(bucketName: string, key: string): Promise<any> {
        const config = new qiniu.conf.Config();
        const bucketManager = new qiniu.rs.BucketManager(this.mac, config);
        return new Promise((resolve, reject) => {
            bucketManager.delete(bucketName, key, (err, respBody, respInfo) => {
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
        const accessToken = qiniu.util.generateAccessToken(this.mac, url, null);
        const options = {headers: {Authorization: accessToken}};
        return http.get(url, options);
    }

    public getBucketFiles(bucketName: string): Promise<any[]> {
        const url = `https://rsf.qbox.me/list?bucket=${bucketName}`;
        const accessToken = qiniu.util.generateAccessToken(this.mac, url, null);
        const options = {headers: {Authorization: accessToken}};
        return http.get(url, options);
    }

    public getBucketList(): Promise<string[]> {
        const url = 'https://rs.qbox.me/buckets';
        const accessToken = qiniu.util.generateAccessToken(this.mac, url, null);
        const options = {headers: {Authorization: accessToken}};
        return http.get(url, options);
    }

}
