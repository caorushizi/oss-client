import "./index.scss";
import React, { useEffect, useState } from "react";
import { Button, Space } from "antd";
import { ipcRenderer, remote } from "../../lib/electron";

type Options = {
  title: string;
  message: string;
};

const App = () => {
  const [message, setMessage] = useState<Options>({
    title: "警告",
    message: "警告"
  });
  useEffect(() => {
    ipcRenderer.on(
      "options",
      (event: Electron.IpcRendererEvent, options: Options) => {
        setMessage({ ...message, ...options });
        remote.getCurrentWindow().show();
      }
    );
  }, [message]);
  return (
    <section className="container">
      <div className="container-header">{message.title}</div>
      <div className="container-body">{message.message}</div>
      <div className="container-footer">
        <Space>
          <Button
            size="small"
            onClick={() => {
              ipcRenderer.send("close-confirm", false);
            }}
          >
            取消
          </Button>
          <Button
            size="small"
            onClick={() => {
              ipcRenderer.send("close-confirm", true);
            }}
          >
            确定
          </Button>
        </Space>
      </div>
    </section>
  );
};

export default App;
