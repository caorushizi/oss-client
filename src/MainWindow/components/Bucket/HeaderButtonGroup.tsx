import React from "react";
import Button from "../BaseButton";

type PropTypes = { fileUpload: () => void };
const HeaderButtonGroup = ({ fileUpload }: PropTypes) => {
  return (
    <section className="buttons-wrapper">
      <Button value="上传文件" icon="arrow-up" onClick={fileUpload} />
      <Button value="上传" disabled onClick={() => {}} />
      <Button value="下载" onClick={() => {}} />
      <Button value="离线下载" onClick={() => {}} />
    </section>
  );
};
export default HeaderButtonGroup;
