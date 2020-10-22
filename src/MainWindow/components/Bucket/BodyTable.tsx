import React, { MouseEvent } from "react";
import "./index.scss";
import { Table } from "antd";
import { Item } from "../../lib/vdir/types";
import Icon from "../IconFont";
import {
  dateFormatter,
  fileSizeFormatter,
  getIconName
} from "../../helper/utils";
import VFolder from "../../lib/vdir/VFolder";
import VFile from "../../lib/vdir/VFile";

type PropTypes = {
  items: Item[];
  selectedItems: string[];
  onFolderSelect: (name: string) => void;
  onFolderContextMenu: (
    event: MouseEvent<HTMLDivElement>,
    item: VFolder
  ) => void;
  onFileSelect: () => void;
  onFileContextMenu: (event: MouseEvent<HTMLElement>, item: VFile) => void;
  onPanelContextMenu: () => void;
  onPanelMouseDown: (event: MouseEvent<HTMLElement>) => void;
};

const tableBodyWrapperHeight = document.body.clientHeight - 160 - 57;

const BodyTable: React.FC<PropTypes> = params => {
  const columns = [
    {
      title: "文件名",
      dataIndex: "name",
      key: "shortId",
      render(name: string, item: Item) {
        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Icon
              type={
                item instanceof VFile
                  ? getIconName(name)
                  : getIconName("folder")
              }
              style={{ fontSize: 25 }}
            />
            <div style={{ paddingLeft: "10px" }}>{name}</div>
          </div>
        );
      }
    },
    {
      title: "大小",
      dataIndex: "size",
      key: "size",
      sorter: (a: Item, b: Item) => a.size - b.size,
      render(size: number) {
        return fileSizeFormatter(size);
      }
    },
    {
      title: "修改日期",
      dataIndex: "lastModified",
      key: "lastModified",
      sorter: (a: Item, b: Item) => a.lastModified - b.lastModified,
      render(timestamp: number) {
        return dateFormatter(timestamp);
      }
    }
  ];

  return (
    <div
      className="main-table"
      onMouseDown={params.onPanelMouseDown}
      onContextMenu={params.onPanelContextMenu}
      role="presentation"
    >
      <Table
        rowKey="shortId"
        dataSource={params.items}
        childrenColumnName="never"
        onRow={record => {
          return {
            onDoubleClick: event => {
              if (record instanceof VFolder) {
                params.onFolderSelect(record.name);
              }
            },
            onContextMenu: event => {
              if (record instanceof VFile) {
                params.onFileContextMenu(event, record);
              }
            }
          };
        }}
        scroll={{ y: tableBodyWrapperHeight }}
        columns={columns}
        pagination={false}
      />
    </div>
  );
};

export default BodyTable;
