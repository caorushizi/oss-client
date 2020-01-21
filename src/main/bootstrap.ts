import {ipcMain} from 'electron';
import ObjectStorageServiceFactory from './services';
import {ObjectStorageServiceType} from './services/types';


function bootstrap() {
  const factory = ObjectStorageServiceFactory.create;
  const ak = 'aKFa7HTRldSWSXpd3nUECT-M4lnGpTHVjKhHsWHD';
  const sk = '7MODMEi2H4yNnHmeeLUG8OReMtcDCpuXHTIUlYtL';
  const qiniu = factory(ObjectStorageServiceType.Qiniu, ak, sk);

  ipcMain.on('get-buckets-request', (event) => {
    qiniu.getBucketList().then((buckets) => {
      event.reply('get-buckets-response', buckets);
    });
  });

  ipcMain.on('get-files-request', (event, name) => {
    qiniu.getBucketFiles(name).then((files) => {
      event.reply('get-files-response', files);
    });
  });

  ipcMain.on('req:file:download', (event, bucket, remotePath) => {
    debugger
    console.log(bucket, remotePath);
    // qiniu.downloadFile(bucket, remotePath).then((res) => {
    //   console.log('下载完成', res)
    // })
  });
}

bootstrap()
