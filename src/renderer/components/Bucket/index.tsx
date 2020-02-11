// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcRenderer } from "electron";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { fileContextMenu } from "../../helper/contextMenu";
import { getFiles } from "../../helper/ipc";
import { qiniuAdapter } from "../../lib/adapter/qiniu";
import { Ffile, Vdir } from "../../lib/vdir";
import { RootState } from "../../store";
import { randomColor, setVdir } from "../../store/app/actions";
import Icon from "../Icon";
import "./index.scss";
import OssButton from "../OssButton";
import { Item } from "../../lib/vdir/types";
import { dateFormatter, fileSizeFormatter } from "../../helper/utils";

type file = Vdir | Ffile;

const Bucket = () => {
  const { name }: { name?: string } = useParams();
  const [files, setFiles] = useState<file[]>([]);
  const selectVdir = (state: RootState) => state.app.vdir;
  const vdir = useSelector(selectVdir);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(randomColor());

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
      <OssButton
        value="上传"
        onClick={() => {
          console.log(123123);
          ipcRenderer.send(
            "req:file:upload",
            "downloads",
            "/",
            "C:\\Users\\admin\\Desktop\\刁振源-2019年终总结.docx"
          );
        }}
      />
      <OssButton
        value="回到根目录"
        onClick={() => {
          vdir.back();
          setFiles(vdir.listFiles());
        }}
      />
      <table className="main-table">
        <thead>
          <tr className="main-table__row">
            <th className="main-table__row_cell">#</th>
            <th className="main-table__row_cell">文件名</th>
            <th className="main-table__row_cell">大小</th>
            <th className="main-table__row_cell">修改日期</th>
          </tr>
        </thead>
        <tbody>
          {files.map((item: Item, index) =>
            Vdir.isDir(item) ? (
              // 文件夹
              <tr
                key={item.name}
                className="main-table__row"
                onContextMenu={() => fileContextMenu(item.name, vdir)}
                onDoubleClick={() => {
                  vdir.changeDir(item.name);
                  setFiles(vdir.listFiles());
                }}
              >
                <td className="main-table__row_cell index">{index}</td>
                <td className="main-table__row_cell title">
                  <Icon className="icon" />
                  <span>{item.name}</span>
                </td>
                <td className="main-table__row_cell size">{fileSizeFormatter(item.size)}</td>
                <td className="main-table__row_cell date">{dateFormatter(item.lastModified)}</td>
              </tr>
            ) : (
              // 文件
              <tr
                key={item.name}
                className="main-table__row"
                onContextMenu={() => fileContextMenu(item.name, vdir)}
                onDoubleClick={() => {
                  console.log("文件类型");
                }}
              >
                <td className="main-table__row_cell index">{index}</td>
                <td className="main-table__row_cell title">
                  <Icon className="icon" filename={item.name} />
                  <span>{item.name}</span>
                </td>
                <td className="main-table__row_cell size">{fileSizeFormatter(item.size)}</td>
                <td className="main-table__row_cell date">{dateFormatter(item.lastModified)}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Bucket;
