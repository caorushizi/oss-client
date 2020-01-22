// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcRenderer } from "electron";
import React, { useEffect, useState } from "react";

import "./index.scss";

function Aside() {
  const [bucketList, setBucketList] = useState([]);

  ipcRenderer.on("get-buckets-response", (event, list) => {
    setBucketList(list);
    ipcRenderer.send("get-files-request", "downloads");
  });

  useEffect(() => {
    ipcRenderer.send("get-buckets-request");
  }, []);

  function getFileReq(item: string) {
    ipcRenderer.send("get-files-request", item);
  }

  return (
    <div className="aside-wrapper">
      <section className="title-bar">
        <span>OSS Client X</span>
      </section>
      <section className="container">
        <p className="title">buckets</p>
        <ul className="list">
          {bucketList.map(item => (
            <li className="item" key={item}>
              <button type="button" title={item} onClick={() => getFileReq(item)}>
                {item}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="container">
        <p className="title">传输</p>
        <ul className="list">
          <li className="item active">传输列表</li>
          <li className="item">传输完成</li>
        </ul>
      </section>
      <section className="container">
        <p className="title">设置</p>
        <ul className="list">
          <li className="item">设置</li>
          <li className="item">关于</li>
        </ul>
      </section>
    </div>
  );
}

export default Aside;
