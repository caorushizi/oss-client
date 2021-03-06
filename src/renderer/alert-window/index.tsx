import "normalize.css/normalize.css";
import "./index.scss";
import reactDom from "react-dom";
import React, { useEffect, useState } from "react";
import { Button } from "antd";
import "antd/dist/antd.css";
import { ipcRenderer, remote } from "../common/script/electron";

type Options = {
  title: string;
  message: string;
};

const App = () => {
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

reactDom.render(<App />, document.getElementById("root"));
