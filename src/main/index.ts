import {app, BrowserWindow} from 'electron';
import ObjectStorageServiceFactory from './services';
import {ObjectStorageServiceType} from './services/types';

declare const MAIN_WINDOW_WEBPACK_ENTRY: any;

if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: Electron.BrowserWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY).then(() => {
    console.log('加载页面成功~');
  });

  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

const factory = ObjectStorageServiceFactory.create;
const ak = 'WEkzRxMlRNk5IZdmqVkhdymoQhQnhchTLlF0I6uJ';
const sk = '6n4LI7KtPcwC5glXSXWoLlKpslpveLORgRE_qNzO';
const qiniu = factory(ObjectStorageServiceType.Qiniu, ak, sk);
qiniu.getBucketList().then((res) => {
  console.log('成功：', res);
});
