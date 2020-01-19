import {ipcRenderer} from 'electron';
import React, {useEffect, useState} from 'react';

import './index.scss';

function Aside() {
  const [bucketList, setBucketList] = useState([]);

  ipcRenderer.on('asynchronous-reply', (event, list) => {
    setBucketList(list);
  });

  useEffect(() => {
    return ipcRenderer.send('asynchronous-message');
  }, []);

  return (
    <div className='wrapper'>
      <ul>
        {bucketList.map((item) => (<li key={item}>{item}</li>))}
      </ul>
    </div>
  );
}

export default Aside;
