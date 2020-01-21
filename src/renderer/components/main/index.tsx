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

const Main = () => {
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
        console.log(items);

        const adapter = new QiniuAdapter();
        const arr = adapter.adaptItems(items);
        const dir = Vdir.from(arr);
        console.log(dir);
        dispatch(setVdir(dir));
        const files1 = dir.listFiles()
        setFiles(files1);
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
              onContextMenu={() => {
                console.log('a:', app)
                fileContextMenu(item, app)
              }}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default Main;

