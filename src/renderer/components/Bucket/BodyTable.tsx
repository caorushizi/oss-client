import React, { MouseEvent, useEffect, useState } from "react";
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

const BodyTable: React.FC<PropTypes> = params => {
  const getHeight = () => document.body.clientHeight - 160 - 39;
  const [tableHeight, setTableHeight] = useState<number>(getHeight());
  const throttle = () => {
    let running = false;
    return () => {
      if (running) {
        return;
      }
      running = true;
      requestAnimationFrame(() => {
        setTableHeight(getHeight());
        running = false;
      });
    };
  };
  const throttleFn = throttle();

  useEffect(() => {
    window.addEventListener("resize", throttleFn);
    return () => {
      window.removeEventListener("resize", throttleFn);
    };
  }, []);

  const columns = [
    {
      title: "文件名",
      dataIndex: "name",
      key: "shortId",
      ellipsis: true,
      render(name: string, item: Item) {
        return (
          <div className="file-meta">
            <Icon
              type={
                item instanceof VFile
                  ? getIconName(name)
                  : getIconName("folder")
              }
              className="file-icon"
            />
            <div className="file-name">{name}</div>
          </div>
        );
      }
    },
    {
      title: "大小",
      dataIndex: "size",
      key: "size",
      sorter: (a: Item, b: Item) => a.size - b.size,
      ellipsis: true,
      render(size: number) {
        return fileSizeFormatter(size);
      }
    },
    {
      title: "修改日期",
      dataIndex: "lastModified",
      key: "lastModified",
      ellipsis: true,
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
        size="small"
        dataSource={params.items}
        childrenColumnName="never"
        showSorterTooltip={false}
        onRow={record => {
          return {
            onDoubleClick(event) {
              if (record instanceof VFolder) {
                params.onFolderSelect(record.name);
              }
            },
            onContextMenu(event) {
              if (record instanceof VFile) {
                params.onFileContextMenu(event, record);
              }
            }
          };
        }}
        scroll={{ y: tableHeight }}
        columns={columns}
        pagination={false}
      />
    </div>
  );
};

export default BodyTable;
