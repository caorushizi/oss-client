import "normalize.css/normalize.css";
import "./index.scss";
import reactDom from "react-dom";
import React, { useEffect, useState } from "react";
import { Button } from "antd";
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

  const onTest = (event: Electron.IpcRendererEvent, options: Options) => {
    setMessage({ ...message, ...options });
    remote.getCurrentWindow().show();
  };

  useEffect(() => {
    window.electron.onIpcEvent("options", onTest);
  }, []);

  return (
    <section className="container">
      <div className="container-header">{message.title}</div>
      <div className="container-body">{message.message}</div>
      <div className="container-footer">
        <Button
          size="small"
          onClick={() => {
            window.electron.closeAlertWindow();
          }}
        >
          确定
        </Button>
      </div>
    </section>
  );
};

export default App;