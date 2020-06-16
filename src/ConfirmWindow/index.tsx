import "normalize.css/normalize.css";
import "./index.scss";
import reactDom from "react-dom";
import React, { useEffect, useState } from "react";
import { Button, Space } from "antd";
import "antd/dist/antd.css";
import "../MainWindow/index.scss";
import { ipcRenderer, remote } from "electron";

type Options = {
  title: string;
  message: string;
};

const App = () => {
  const [message, setMessage] = useState<Options>({
    title: "警告",
    message: ""
  });
  useEffect(() => {
    ipcRenderer.on("options", (e, options: Options) => {
      setMessage({ ...message, ...options });
      remote.getCurrentWindow().show();
    });
  }, []);
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

reactDom.render(<App />, document.getElementById("root"));
