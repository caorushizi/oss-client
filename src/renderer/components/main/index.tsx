import {ipcRenderer} from 'electron';
import React, {useEffect, useState} from 'react';
import {CSSTransition} from 'react-transition-group';

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

  const [inProp, setInProp] = useState(false);
  const [show, setShow] = useState(true);

  return (
    <>
      <div>
        <CSSTransition
          in={inProp}
          timeout={1200}
          classNames="main-wrapper"
          unmountOnExit
          onEnter={() => setShow(false)}
          onExited={() => setShow(true)}
        >
          <div>
            <ul>
              {files.map((item: any) => (<li key={item.key}>{item.key}</li>))}
            </ul>
          </div>
        </CSSTransition>
        <button type="button" onClick={() => setInProp(!inProp)}>
          Click to Enter
        </button>
      </div>
    </>
  );
}

export default Main;
