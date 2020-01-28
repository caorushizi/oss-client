// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcRenderer } from "electron";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fileContextMenu } from "../../helper/contextMenu";
import { qiniuAdapter } from "../../lib/adapter/qiniu";
import { Vdir } from "../../lib/vdir";
import { RootState } from "../../store";
import { setVdir } from "../../store/app/actions";

import "./index.scss";

const Main = () => {
  const selectApp = (state: RootState) => state.app.vdir;
  const app = useSelector(selectApp);
  const dispatch = useDispatch();

  const [files, setFiles] = useState<any[]>([]);
  // TODO:为什么不放在 useEffect 中会不断执行
  useEffect(() => {
    ipcRenderer.on("get-files-response", (event, { items }) => {
      const dir = Vdir.from(qiniuAdapter(items));
      dispatch(setVdir(dir));
      setFiles(dir.listFiles());
    });
  }, []);

  return (
    <div className="main-wrapper">
      <button
        className="none"
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
        上传
      </button>
      <button
        type="button"
        onClick={() => {
          app.back();
          setFiles(app.listFiles());
        }}
      >
        回到根目录
      </button>
      <ul className="main-list">
        {files.map((item: any) => (
          <li
            key={item.name}
            className="main-item"
            onContextMenu={() => fileContextMenu(item.name, app)}
            onDoubleClick={() => {
              if (item.type === "dir") {
                console.log(app);
                app.changeDir(item.name);
                setFiles(app.listFiles());
              }
            }}
          >
            {item.type}
            <span>\</span>
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Main;
