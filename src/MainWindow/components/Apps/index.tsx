import React, { useEffect, useState } from "react";
import "./index.scss";
import { ipcRenderer } from "electron";
import { AppStore } from "../../../main/store/apps";
import Button from "../Button";
import Input from "../Input";
import { OssType } from "../../../main/types";

const Apps = () => {
  const [apps, setApps] = useState<AppStore[]>([]);
  const [currentApp, setCurrentApp] = useState<AppStore>();

  useEffect(() => {
    ipcRenderer.send("getApps");
    ipcRenderer.on("appsRep", (event, args: AppStore[]) => {
      setApps(args);
    });
  }, []);

  return (
    <div className="apps-wrapper">
      <section className="apps-main">
        <div className="main-left">
          <div className="header">
            <Button
              value="添加"
              onClick={() => {
                const app: AppStore = {
                  ak: "",
                  sk: "",
                  name: "默认名称",
                  type: OssType.qiniu,
                  uploadBucket: "",
                  uploadPrefix: ""
                };
                setApps([...apps, app]);
                setCurrentApp(app);
              }}
            />
          </div>
          <ul className="list">
            {apps.length > 0 ? (
              apps.map(app => (
                <li className="item active">
                  <svg className="icon" aria-hidden="true">
                    <use xlinkHref="#icon-qiniuyun1" />
                  </svg>
                  <span>名称</span>
                </li>
              ))
            ) : (
              <li className="no-result">
                <p>没有 Apps</p>
                <p>暂时没有搜索到 apps</p>
              </li>
            )}
          </ul>
        </div>
        <div className="main-right">
          <div className="name">名称</div>
          {currentApp ? (
            <ul className="config-list">
              <li className="config-item">
                <span className="title">名称</span>
                <Input placeholder="请输入名称" />
              </li>
              <li className="config-item">
                <span className="title">ak</span>
                <Input placeholder="请输入相应服务商 ak" />
              </li>
              <li className="config-item">
                <span className="title">sk</span>
                <Input placeholder="请输入相应服务商 sk" />
              </li>
              <li className="config-item">
                <span className="title">bucket</span>
                <Input placeholder="请输入 bucket" />
              </li>
              <li className="config-item">
                <span className="title">prefix</span>
                <Input placeholder="请输入 prefix" />
              </li>
            </ul>
          ) : (
            <div>12123</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Apps;
