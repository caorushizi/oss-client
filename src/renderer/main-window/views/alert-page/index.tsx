import "./index.scss";
import React, { FC, useEffect, useState } from "react";
import { Button } from "antd";
import { ipcRenderer, remote } from "../../../common/script/electron";

type Options = {
  title: string;
  message: string;
};

const AlertPage: FC = () => {
  const [message, setMessage] = useState<Options>({
    title: "警告",
    message: "警告"
  });

  const onTest = (event: Electron.IpcRendererEvent, options: Options) => {
    setMessage({ ...message, ...options });
    remote.getCurrentWindow().show();
  };

  useEffect(() => {
    ipcRenderer.on("options", onTest);
  }, []);
  return (
    <section className="container">
      <div className="container-header">{message.title}</div>
      <div className="container-body">{message.message}</div>
      <div className="container-footer">
        <Button
          size="small"
          onClick={() => {
            ipcRenderer.send("close-alert");
          }}
        >
          确定
        </Button>
      </div>
    </section>
  );
};

export default AlertPage;
