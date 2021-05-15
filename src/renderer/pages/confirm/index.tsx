import "normalize.css/normalize.css";
import "./index.scss";
import React, { useEffect, useState } from "react";
import { Button, Space } from "antd";
import "antd/dist/antd.css";

type Options = {
  title: string;
  message: string;
};

const App = () => {
  const [message, setMessage] = useState<Options>({
    title: "警告",
    message: "警告",
  });

  useEffect(() => {
    window.electron.onIpcEvent(
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
              window.electron.closeConfirmWindow(false);
            }}
          >
            取消
          </Button>
          <Button
            size="small"
            onClick={() => {
              window.electron.closeConfirmWindow(true);
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
