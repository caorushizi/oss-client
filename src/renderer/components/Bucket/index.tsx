// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcRenderer } from "electron";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { fileContextMenu } from "../../helper/contextMenu";
import { dialog } from "../../helper/remote";
import { qiniuAdapter } from "../../lib/adapter/qiniu";
import { Item, Vdir } from "../../lib/vdir";
import { RootState } from "../../store";
import { setVdir } from "../../store/app/actions";
import Icon from "../Icon";

import "./index.scss";
import { getFiles } from "../../helper/ipc";

type file = Vdir | Item;

const Bucket = () => {
  const { name }: { name?: string } = useParams();
  const [files, setFiles] = useState<file[]>([]);
  const selectApp = (state: RootState) => state.app.vdir;
  const app = useSelector(selectApp);
  const dispatch = useDispatch();

  useEffect(() => {
    if (name) {
      getFiles(name);
    }
  }, [name]);

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
        {files.map((item: Vdir | Item) => (
          <li
            key={item.name}
            className="main-item"
            onContextMenu={() => fileContextMenu(item.name, app)}
            onDoubleClick={() => {
              if (item instanceof Vdir) {
                console.log(app);
                app.changeDir(item.name);
                setFiles(app.listFiles());
              } else {
                console.log("文件类型");
              }
            }}
          >
            <Icon item={item} />
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Bucket;
