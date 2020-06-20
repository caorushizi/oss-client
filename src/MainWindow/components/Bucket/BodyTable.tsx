import React, { useState } from "react";
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
      key: "name",
      render(name: string, item: any) {
        console.log(item);
        return (
          <>
            <Icon
              type={
                item.itemType !== "folder"
                  ? getIconName(name)
                  : getIconName("folder")
              }
              style={{ fontSize: 30 }}
            />
            <span>{name}</span>
          </>
        );
      }
    },
    {
      title: "大小",
      dataIndex: "size",
      key: "size",
      sorter: (a: any, b: any) => a.age - b.age
    },
    {
      title: "修改日期",
      dataIndex: "lastModified",
      key: "lastModified",
      sorter: (a: any, b: any) => a.age - b.age
    }
  ];

  console.log(items);

  const rowSelection = {
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
  };

  return (
    <Table
      className="main-table-wrapper"
      dataSource={items}
      rowSelection={{
        type: "checkbox",
        ...rowSelection
      }}
      columns={columns}
      pagination={false}
    />
  );
};

export default BodyTable;
