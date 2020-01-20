import {ipcRenderer} from 'electron';
import React, {useEffect, useState} from 'react';
import {fileContextMenu} from '../../helper/contextMenu'

import './index.scss';
import {Vdir} from "../../lib/vdir";
import QiniuAdapter from "../../lib/adapter/qiniu";

function Main() {
  const [files, setFiles] = useState<string[]>([]);
  // TODO:为什么不放在 useEffect 中会不断执行
  useEffect(() => {
    ipcRenderer.on(
      'get-files-response',
      (event, {items}) => {
        console.log(items)

        const adapter = new QiniuAdapter();
        const arr = adapter.adaptItems(items);
        const dir = Vdir.from(arr);
        console.log(dir);
        const files1 = dir.listFiles()
        setFiles(files1);
      },
    );
  }, []);

  return (
    <div className='main-wrapper'>
      <ul className='main-list'>
        {files.map((item: any, index) => (
          <li key={index} className='main-item'
              onContextMenu={() => fileContextMenu(item)}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default Main;
