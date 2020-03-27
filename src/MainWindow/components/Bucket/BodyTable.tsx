import React from "react";
import "./index.scss";
import { Item } from "../../lib/vdir/types";
import Icon from "../FileIcon";
import { dateFormatter, fileSizeFormatter } from "../../helper/utils";
import VFolder from "../../lib/vdir/VFolder";
import VFile from "../../lib/vdir/VFile";

type PropTypes = {
  items: Item[];
  selectedItems: Item[];
  onSelectItem: () => void;
  onFolderSelect: (name: string) => void;
  onFolderContextMenu: (item: VFolder) => void;
  onFileSelect: () => void;
  onFileContextMenu: (item: VFile) => void;
};

const BodyTable = ({
  items,
  selectedItems,
  onSelectItem,
  onFolderSelect,
  onFolderContextMenu,
  onFileSelect,
  onFileContextMenu
}: PropTypes) => {
  return (
    <div className="main-table-wrapper">
      {items.length > 0 ? (
        <table className="main-table">
          <thead>
            <tr className="main-table__row">
              <th className="main-table__row_cell index">#</th>
              <th className="main-table__row_cell">文件名</th>
              <th className="main-table__row_cell">大小</th>
              <th className="main-table__row_cell">修改日期</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: Item, index) =>
              item instanceof VFolder ? (
                // 文件夹
                <tr
                  key={item.name}
                  className="main-table__row"
                  onContextMenu={() => onFolderContextMenu(item)}
                  onDoubleClick={() => onFolderSelect(item.name)}
                >
                  <td className="main-table__row_cell index">{index + 1}</td>
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
                  onContextMenu={() => onFileContextMenu(item)}
                  onDoubleClick={onFileSelect}
                >
                  <td className="main-table__row_cell index">{index + 1}</td>
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

export default BodyTable;
