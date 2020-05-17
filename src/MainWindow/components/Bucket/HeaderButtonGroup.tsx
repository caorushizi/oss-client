import React from "react";
import { Button, Space } from "antd";
import { UploadOutlined } from "@ant-design/icons";

type PropTypes = {
  fileUpload: () => void;
  selectedItems: string[];
  onDownload: () => void;
  onDelete: () => void;
};
const HeaderButtonGroup = ({
  fileUpload,
  selectedItems,
  onDownload,
  onDelete
}: PropTypes) => {
  return (
    <Space size="middle" className="buttons-wrapper">
      <Button size="small" onClick={fileUpload}>
        <UploadOutlined />
        上传文件
      </Button>
      <Button
        size="small"
        disabled={selectedItems.length === 0}
        onClick={onDownload}
      >
        下载
      </Button>
      <Button
        size="small"
        disabled={selectedItems.length === 0}
        onClick={onDelete}
      >
        删除
      </Button>
      {/* <Button value="新建文件夹" onClick={() => {}} /> */}
      {/* <Button value="离线下载" onClick={() => {}} /> */}
    </Space>
  );
};
export default HeaderButtonGroup;
