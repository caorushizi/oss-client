import {ipcMain} from 'electron';
import ObjectStorageServiceFactory from './services';
import {ObjectStorageServiceType} from './services/types';


export default function bootstrap() {
  const factory = ObjectStorageServiceFactory.create;
  const ak = 'aKFa7HTRldSWSXpd3nUECT-M4lnGpTHVjKhHsWHD';
  const sk = '7MODMEi2H4yNnHmeeLUG8OReMtcDCpuXHTIUlYtL';
  const qiniu = factory(ObjectStorageServiceType.Qiniu, ak, sk);
  const bucketName = 'downloads';

  ipcMain.on('get-buckets-request', (event) => {
    qiniu.getBucketList().then((buckets) => {
      event.reply('get-buckets-response', buckets);
    });
  });

  ipcMain.on('get-files-request', (event, name) => {
    name = bucketName;
    qiniu.getBucketFiles(name).then((files) => {
      event.reply('get-files-response', files);
    });
  });

  ipcMain.on('req:file:download', (event, bucket, item) => {
    bucket = bucketName;
    const remotePath = item.webkitRelativePath;
    qiniu.downloadFile(bucket, remotePath).then((res) => {
      console.log('get link done!', res)
    })
  });
}

