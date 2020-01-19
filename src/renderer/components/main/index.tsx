import {ipcRenderer} from 'electron';
import React, {useEffect, useState} from 'react';

import './index.scss';

function Main() {
  const [files, setFiles] = useState([]);
  // TODO:为什么不放在 useEffect 中会不断执行
  useEffect(() => {
    ipcRenderer.on(
      'get-files-response',
      (event, all) => {
        console.log('test123', all.items);
        setFiles(all.items);
      },
    );
  }, []);

  return (
    <div className='main-wrapper'>
      <ul>
        {files.map((item: any) => (<li key={item.key}>{item.key}</li>))}
      </ul>
    </div>
  );
}

export default Main;
