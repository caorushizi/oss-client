import React from "react";
import { Button, Space } from "antd";
import { UploadOutlined } from "@ant-design/icons";

type PropTypes = {
  fileUpload: () => void;
  selectedItems: string[];
  onDownload: () => void;
  onDelete: () => void;
};
const HeaderButtonGroup: React.FC<PropTypes> = params => {
  return (
    <Space size="middle" className="buttons-wrapper">
      <Button size="small" onClick={params.fileUpload}>
        <UploadOutlined />
        上传文件
      </Button>
      <Button
        size="small"
        disabled={params.selectedItems.length === 0}
        onClick={params.onDownload}
      >
        下载
      </Button>
      <Button
        size="small"
        disabled={params.selectedItems.length === 0}
        onClick={params.onDelete}
      >
        删除
      </Button>
    </Space>
  );
};
export default HeaderButtonGroup;
