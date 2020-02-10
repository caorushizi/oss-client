// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcRenderer } from "electron";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { fileContextMenu } from "../../helper/contextMenu";
import { getFiles } from "../../helper/ipc";
import { qiniuAdapter } from "../../lib/adapter/qiniu";
import { Item, Vdir } from "../../lib/vdir";
import { RootState } from "../../store";
import { setVdir } from "../../store/app/actions";
import Icon from "../Icon";

import "./index.scss";

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
      <input
        className="oss-button"
        type="button"
        value="上传"
        onClick={() => {
          ipcRenderer.send(
            "req:file:upload",
            "downloads",
            "/",
            "C:\\Users\\admin\\Desktop\\刁振源-2019年终总结.docx"
          );
        }}
      />
      <input
        type="button"
        className="oss-button"
        value="回到根目录"
        onClick={() => {
          app.back();
          setFiles(app.listFiles());
        }}
      />
      <table className="main-table">
        {files.map((item: Vdir | Item) =>
          Vdir.isDir(item) ? (
            // 文件夹
            <tr
              key={item.name}
              className="main-item"
              onContextMenu={() => fileContextMenu(item.name, app)}
              onDoubleClick={() => {
                app.changeDir(item.name);
                setFiles(app.listFiles());
              }}
            >
              <td>
                <Icon className="icon" />
              </td>
              <td>{item.name}</td>
            </tr>
          ) : (
            // 文件
            <tr
              key={item.name}
              className="main-item"
              onContextMenu={() => fileContextMenu(item.name, app)}
              onDoubleClick={() => {
                console.log("文件类型");
              }}
            >
              <td>
                <Icon className="icon" filename="123.txt" />
              </td>
              <td>{item.name}</td>
            </tr>
          )
        )}
      </table>
    </div>
  );
};

export default Bucket;
