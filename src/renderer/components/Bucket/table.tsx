import React, { useEffect, useState } from "react";
import "./index.scss";
import { Item } from "../../lib/vdir/types";
import { Vdir } from "../../lib/vdir";
import { fileContextMenu } from "../../helper/contextMenu";
import Icon from "../Icon";
import { dateFormatter, fileSizeFormatter } from "../../helper/utils";

const Table = ({ vdir }: { vdir: Vdir }) => {
  const [files, setFiles] = useState<Item[]>([]);

  useEffect(() => {
    setFiles(vdir.listFiles());
  }, [vdir]);

  return (
    <div className="main-table-wrapper">
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

export default Table;
