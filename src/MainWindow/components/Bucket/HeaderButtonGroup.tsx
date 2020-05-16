import React from "react";
import Button from "../BaseButton";

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
      <Button value="上传文件" icon="arrow-up" onClick={fileUpload} />
      <Button
        value="下载"
        icon="arrow-down"
        disabled={selectedItems.length === 0}
        onClick={onDownload}
      />
      <Button
        value="删除"
        disabled={selectedItems.length === 0}
        onClick={onDelete}
      />
      {/* <Button value="新建文件夹" onClick={() => {}} /> */}
      {/* <Button value="离线下载" onClick={() => {}} /> */}
    </section>
  );
};
export default HeaderButtonGroup;
