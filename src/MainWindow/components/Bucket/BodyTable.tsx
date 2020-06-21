import React from "react";
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
  onSelectItem: (fileId: string) => void;
  onRemoveItem: (fileId: string) => void;
  onFolderSelect: (name: string) => void;
  onFolderContextMenu: (item: VFolder) => void;
  onFileSelect: () => void;
  onFileContextMenu: (item: VFile) => void;
};

const tableBodyWrapperHeight = document.body.clientHeight - 160 - 57;

const BodyTable = ({
  items,
  selectedItems,
  onSelectItem,
  onRemoveItem,
  onFolderSelect,
  onFolderContextMenu,
  onFileSelect,
  onFileContextMenu
}: PropTypes) => {
  const columns = [
    {
      title: "文件名",
      dataIndex: "name",
      key: "shortId",
      render(name: string, item: any) {
        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Icon
              type={
                item.itemType !== "folder"
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
      sorter: (a: any, b: any) => a.size - b.size,
      render(size: number) {
        return fileSizeFormatter(size);
      }
    },
    {
      title: "修改日期",
      dataIndex: "lastModified",
      key: "lastModified",
      sorter: (a: any, b: any) => a.lastModified - b.lastModified,
      render(timestamp: number) {
        return dateFormatter(timestamp);
      }
    }
  ];

  console.log(items);

  return (
    <Table
      rowKey="shortId"
      className="main-table-wrapper"
      dataSource={items}
      rowSelection={{
        type: "checkbox",
        onChange: (selectedRowKeys: any, selectedRows: any) => {
          console.log(
            `selectedRowKeys: ${selectedRowKeys}`,
            "selectedRows: ",
            selectedRows
          );
        },
        getCheckboxProps: (record: any) => ({
          disabled: record.name === "Disabled User", // Column configuration not to be checked
          name: record.name
        })
      }}
      bordered={false}
      scroll={{ y: tableBodyWrapperHeight }}
      columns={columns}
      pagination={false}
    />
  );
};

export default BodyTable;
