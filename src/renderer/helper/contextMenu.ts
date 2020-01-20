import {remote, ipcRenderer} from 'electron';
import {Item} from "../lib/vdir";

export function fileContextMenu(file: Item) {
  const menu = remote.Menu
    .buildFromTemplate([{
      label: '全选',
      click: () => console.log(123123),
    }, {type: 'separator'}, {
      label: '复制链接',
      click: () => console.log(123123),
    }, {
      label: '复制链接（markdown）',
      click: () => console.log(123123),
    }, {type: 'separator'}, {
      label: '下载',
      click: () => {
        ipcRenderer.send('req:file:download', '123', file)
      },
    }, {
      label: '删除',
      click: () => console.log(123123),
    }]);
  menu.popup()
}


