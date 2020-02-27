import React, { useEffect, useState } from "react";
import "./index.scss";
import { ipcRenderer } from "electron";
import classNames from "classnames";
import { AppStore } from "../../../main/store/apps";
import Button from "../Button";
import Input from "../Input";
import { OssType } from "../../../main/types";
import { addApp } from "../../ipc";

const mockData: AppStore[] = [
  {
    _id: "1",
    ak: "1",
    sk: "1",
    name: "默认名称1",
    type: OssType.qiniu,
    uploadBucket: "",
    uploadPrefix: ""
  },
  {
    _id: "2",
    ak: "",
    sk: "",
    name: "默认名称2",
    type: OssType.qiniu,
    uploadBucket: "",
    uploadPrefix: ""
  },
  {
    _id: "3",
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
                    active: app._id === currentApp?._id
                  })}
                  key={app.name}
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
          <div className="name">{currentApp?.name || "未命名"}</div>
          {currentApp ? (
            <div className="config-content">
              <div className="config-item">
                <span className="title">名称</span>
                <Input
                  className="input-item"
                  placeholder="请输入名称"
                  defaultValue={currentApp?.name}
                  onChange={event => {
                    event.persist();
                    const { value } = event.target;
                    setCurrentApp({ ...currentApp, name: value });
                  }}
                />
              </div>
              <div className="config-item">
                <span className="title">类型</span>
                <select className="select-item" name="bucket" id="bucket">
                  <option value={OssType.qiniu}>七牛云</option>
                  <option value={OssType.ali}>阿里云</option>
                  <option value={OssType.tencent}>腾讯云</option>
                </select>
              </div>
              <div className="config-item">
                <span className="title">ak</span>
                <Input
                  className="input-item"
                  placeholder="请输入相应服务商 ak"
                  defaultValue={currentApp?.ak}
                />
              </div>
              <div className="config-item">
                <span className="title">sk</span>
                <Input
                  className="input-item"
                  placeholder="请输入相应服务商 sk"
                  defaultValue={currentApp?.sk}
                />
              </div>
              {/* <div className="config-item"> */}
              {/*  <span className="title">bucket</span> */}
              {/*  <Input */}
              {/*    className="input-item" */}
              {/*    placeholder="请输入bucket" */}
              {/*    defaultValue={currentApp?.bucket} */}
              {/*  /> */}
              {/* </div> */}
              {/* <div className="config-item"> */}
              {/*  <span className="title">prefix</span> */}
              {/*  <Input */}
              {/*    className="input-item" */}
              {/*    placeholder="请输入 prefix" */}
              {/*    defaultValue={currentApp?.uploadPrefix} */}
              {/*  /> */}
              {/* </div> */}
            </div>
          ) : (
            <div>12123</div>
          )}
          <div>
            <Button
              value="123"
              onClick={() => {
                addApp(
                  currentApp!.name,
                  currentApp!.type,
                  currentApp!.ak,
                  currentApp!.sk
                ).then(app => {
                  console.log(app);
                });
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Apps;
