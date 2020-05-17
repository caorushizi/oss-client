import React from "react";
import { Button } from "antd";

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
    <section className="buttons-wrapper">
      <Button onClick={fileUpload}>上传文件</Button>
      <Button disabled={selectedItems.length === 0} onClick={onDownload}>
        下载
      </Button>
      <Button disabled={selectedItems.length === 0} onClick={onDelete}>
        删除
      </Button>
      {/* <Button value="新建文件夹" onClick={() => {}} /> */}
      {/* <Button value="离线下载" onClick={() => {}} /> */}
    </section>
  );
};
export default HeaderButtonGroup;
