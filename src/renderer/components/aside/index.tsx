import {ipcRenderer} from 'electron';
import React, {useEffect, useState} from 'react';

import './index.scss';

function Aside() {
  const [bucketList, setBucketList] = useState([]);

  ipcRenderer.on(
    'get-buckets-response',
    (event, list) => {
      setBucketList(list);
    },
  );

  useEffect(() => {
    console.log('testtest')
    ipcRenderer.send('get-buckets-request');
  }, []);

  return (
    <div className='aside-wrapper'>
      <ul>
        {bucketList.map((item) => (<li key={item}>
          <button onClick={() => {
            ipcRenderer.send('get-files-request', item);
          }}>
            {item}
          </button>
        </li>))}
      </ul>
    </div>
  );
}

export default Aside;
