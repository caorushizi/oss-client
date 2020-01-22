// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcRenderer } from "electron";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fileContextMenu } from "../../helper/contextMenu";
import { qiniuAdapter } from "../../lib/adapter/qiniu";
import { Vdir } from "../../lib/vdir";
import { RootState } from "../../store";
import { setVdir } from "../../store/app/actions";
import { increase } from "../../store/counter/actions";

import "./index.scss";

const Main = () => {
  const selectCount = (state: RootState) => state.counter.count;
  const count = useSelector(selectCount);
  const selectApp = (state: RootState) => state.app.vdir;
  const app = useSelector(selectApp);
  const dispatch = useDispatch();

  const [files, setFiles] = useState<string[]>([]);
  // TODO:为什么不放在 useEffect 中会不断执行
  useEffect(() => {
    ipcRenderer.on("get-files-response", (event, { items }) => {
      const dir = Vdir.from(qiniuAdapter(items));
      dispatch(setVdir(dir));
      setFiles(dir.listFiles());
    });
  }, []);

  function handleIncrease() {
    dispatch(increase());
  }

  return (
    <div className="main-wrapper">
      <span>{count}</span>
      <button type="button" onClick={handleIncrease}>
        increase
      </button>
      <button
        type="button"
        onClick={() => {
          ipcRenderer.send(
            "req:file:upload",
            "downloads",
            "/",
            "C:\\Users\\admin\\Desktop\\刁振源-2019年终总结.docx"
          );
        }}
      >
        upload
      </button>
      <ul className="main-list">
        {files.map((item: any) => (
          <li key={item} className="main-item" onContextMenu={() => fileContextMenu(item, app)}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Main;
