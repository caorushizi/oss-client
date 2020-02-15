import { ipcRenderer, remote } from "electron";
import React from "react";
import Button from "../Button";

const Buttons = () => {
  return (
    <section className="buttons-wrapper">
      <Button
        value="上传文件"
        icon="arrow-up"
        onClick={() => {
          const userPath = remote.app.getPath("documents");
          remote.dialog
            .showOpenDialog({
              defaultPath: userPath,
              properties: ["openFile"]
            })
            .then(result => {
              if (!result.canceled) {
                result.filePaths.forEach(item => {
                  ipcRenderer.send("req:file:upload", "downloads", "/", item);
                });
              }
            })
            .catch(err => {
              console.log(err);
            });
        }}
      />
      <Button value="上传" disabled onClick={() => {}} />
      <Button value="下载" onClick={() => {}} />
      <Button value="离线下载" onClick={() => {}} />
    </section>
  );
};
export default Buttons;
