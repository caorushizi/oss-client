import React, { useEffect, useState } from "react";
import "./index.scss";
import { ipcRenderer } from "electron";
import { AppStore } from "../../../main/store/apps";
import Button from "../Button";
import Input from "../Input";
import { OssType } from "../../../main/types";
import classNames from "classnames";

const mockData: AppStore[] = [
  {
    id: "1",
    ak: "1",
    sk: "1",
    name: "默认名称1",
    type: OssType.qiniu,
    uploadBucket: "",
    uploadPrefix: ""
  },
  {
    id: "2",
    ak: "",
    sk: "",
    name: "默认名称2",
    type: OssType.qiniu,
    uploadBucket: "",
    uploadPrefix: ""
  },
  {
    id: "3",
    ak: "",
    sk: "",
    name: "默认名称3",
    type: OssType.qiniu,
    uploadBucket: "",
    uploadPrefix: ""
  }
];

const Apps = () => {
  const [apps, setApps] = useState<AppStore[]>([]);
  const [currentApp, setCurrentApp] = useState<AppStore>();

  useEffect(() => {
    // ipcRenderer.send("getApps");
    // ipcRenderer.on("appsRep", (event, args: AppStore[]) => {
    //   setApps(args);
    // });
    setApps(mockData);
    if (!currentApp) {
      setCurrentApp(mockData[0]);
    }
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
          <ul className="app-list">
            {apps.length > 0 ? (
              apps.map(app => (
                <li
                  className={classNames("item", {
                    active: app.id === currentApp?.id
                  })}
                >
                  <svg className="icon" aria-hidden="true">
                    <use xlinkHref="#icon-qiniuyun1" />
                  </svg>
                  <span>{app.name}</span>
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
          <div className="name">{currentApp?.name}</div>
          {currentApp ? (
            <ul className="config-list">
              <li className="config-item">
                <span className="title">名称</span>
                <Input
                  placeholder="请输入名称"
                  defaultValue={currentApp?.name}
                  onChange={event => {
                    event.persist();
                    const { value } = event.target;
                    setCurrentApp({ ...currentApp, name: value });
                  }}
                />
              </li>
              <li className="config-item">
                <span className="title">ak</span>
                <Input
                  placeholder="请输入相应服务商 ak"
                  defaultValue={currentApp?.ak}
                />
              </li>
              <li className="config-item">
                <span className="title">sk</span>
                <Input
                  placeholder="请输入相应服务商 sk"
                  defaultValue={currentApp?.sk}
                />
              </li>
              <li className="config-item">
                <span className="title">bucket</span>
                <Input
                  placeholder="请输入 bucket"
                  defaultValue={currentApp?.uploadBucket}
                />
              </li>
              <li className="config-item">
                <span className="title">prefix</span>
                <Input
                  placeholder="请输入 prefix"
                  defaultValue={currentApp?.uploadPrefix}
                />
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
