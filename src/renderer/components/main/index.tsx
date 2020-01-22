import {ipcRenderer} from 'electron';
import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {fileContextMenu} from '../../helper/contextMenu';
import QiniuAdapter from '../../lib/adapter/qiniu';
import {Vdir} from '../../lib/vdir';
import {RootState} from '../../store';
import {setVdir} from '../../store/app/actions';
import {increase} from '../../store/counter/actions';

import './index.scss';

const adapter = new QiniuAdapter();

const main = () => {
  const selectCount = (state: RootState) => state.counter.count;
  const count = useSelector(selectCount);
  const selectApp = (state: RootState) => state.app.vdir;
  const app = useSelector(selectApp);
  const dispatch = useDispatch();

  const [files, setFiles] = useState<string[]>([]);
  // TODO:为什么不放在 useEffect 中会不断执行
  useEffect(() => {
    ipcRenderer.on(
      'get-files-response',
      (event, {items}) => {
        const dir = Vdir.from(adapter.adaptItems(items));
        dispatch(setVdir(dir));
        setFiles(dir.listFiles());
      },
    );
  }, []);

  return (
    <div className='main-wrapper'>
      <div>{count}</div>
      <button onClick={() => dispatch(increase())}>increase
      </button>
      <ul className='main-list'>
        {files.map((item: any, index) => (
          <li key={index} className='main-item'
              onContextMenu={() => fileContextMenu(item, app)}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default main;

