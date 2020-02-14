import { ipcRenderer } from "electron";
import React from "react";
import Button from "../Button";

const Buttons = () => {
  return (
    <section className="buttons-wrapper">
      <Button
        value="上传文件"
        icon="arrow-up"
        onClick={() => {
          ipcRenderer.send(
            "req:file:upload",
            "downloads",
            "/",
            "C:\\Users\\admin\\Desktop\\刁振源-2019年终总结.docx"
          );
        }}
      />
      <Button
        value="回到根目录"
        onClick={() => {
          // vdir.back();
          // setFiles(vdir.listFiles());
        }}
      />
      <Button value="上传" disabled onClick={() => {}} />
      <Button value="下载" onClick={() => {}} />
      <Button value="离线下载" onClick={() => {}} />
    </section>
  );
};
export default Buttons;
