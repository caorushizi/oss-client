import React, { useEffect, useState } from "react";
import "./index.scss";
import { useDispatch, useSelector } from "react-redux";
import { Item } from "../../lib/vdir/types";
import { Vdir } from "../../lib/vdir";
import { fileContextMenu, vdirContextMenu } from "../../helper/contextMenu";
import { RootState } from "../../store";
import { changeNotifier } from "../../store/app/actions";
import Icon from "../Icon";
import { dateFormatter, fileSizeFormatter } from "../../helper/utils";
import Ffile from "../../lib/vdir/ffile";

type PropTypes = { vdir: Vdir };

const Table = ({ vdir }: PropTypes) => {
  const dispatch = useDispatch();
  const [files, setFiles] = useState<Item[]>([]);

  const selectApp = (state: RootState) => state.app;
  const app = useSelector(selectApp);

  useEffect(() => {
    setFiles(vdir.listFiles());
  }, [app.notifier, vdir]);

  return (
    <div className="main-table-wrapper">
      {files.length > 0 ? (
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
                  onContextMenu={() => vdirContextMenu(item as Vdir)}
                  onDoubleClick={() => {
                    dispatch(changeNotifier());
                    vdir.changeDir(item.name);
                    setFiles(vdir.listFiles());
                  }}
                >
                  <td className="main-table__row_cell index">{index}</td>
                  <td className="main-table__row_cell title">
                    <Icon className="icon" />
                    <span>{item.name}</span>
                  </td>
                  <td className="main-table__row_cell size">
                    {fileSizeFormatter(item.size)}
                  </td>
                  <td className="main-table__row_cell date">
                    {dateFormatter(item.lastModified)}
                  </td>
                </tr>
              ) : (
                // 文件
                <tr
                  key={item.name}
                  className="main-table__row"
                  onContextMenu={() => {
                    const domain = app.domains.length > 0 ? app.domains[0] : "";
                    fileContextMenu(item as Ffile, domain);
                  }}
                  onDoubleClick={() => {}}
                >
                  <td className="main-table__row_cell index">{index}</td>
                  <td className="main-table__row_cell title">
                    <Icon className="icon" filename={item.name} />
                    <span>{item.name}</span>
                  </td>
                  <td className="main-table__row_cell size">
                    {fileSizeFormatter(item.size)}
                  </td>
                  <td className="main-table__row_cell date">
                    {dateFormatter(item.lastModified)}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      ) : (
        <div className="no-files">
          <div className="title">没有文件</div>
          <div className="sub-title">当前 bucket 中没有文件</div>
        </div>
      )}
    </div>
  );
};

export default Table;
