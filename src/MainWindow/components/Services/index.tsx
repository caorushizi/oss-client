import React, { useEffect, useState } from "react";
import "./index.scss";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AppStore } from "../../../main/store/apps";
import Button from "../BaseButton";
import Input from "../BaseInput";
import { OssType } from "../../../main/types";
import { addApp, getAppsChannel } from "../../ipc";

const defaultApp: AppStore = {
  ak: "",
  sk: "",
  name: "默认名称",
  type: OssType.qiniu,
  uploadBucket: "",
  uploadPrefix: ""
};

const Apps = () => {
  const [apps, setApps] = useState<AppStore[]>([]);
  const [currentApp, setCurrentApp] = useState<AppStore>();

  useEffect(() => {
    getAppsChannel().then(allApps => {
      setApps(allApps);
      if (!currentApp) {
        setCurrentApp(allApps[0]);
      }
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
                const app: AppStore = { ...defaultApp };
                setApps([...apps, app]);
                setCurrentApp(app);
              }}
            />
          </div>
          <ul className="app-list">
            {apps.length > 0 ? (
              apps.map((app, index) => (
                <li
                  className={classNames("item", {
                    active: app._id === currentApp?._id
                  })}
                  key={app.name + app.sk}
                >
                  <button
                    type="button"
                    className="button"
                    onClick={() => {
                      setCurrentApp(apps[index]);
                    }}
                  >
                    <svg className="icon" aria-hidden="true">
                      <use xlinkHref="#icon-qiniuyun1" />
                    </svg>
                    <span>{app.name}</span>
                  </button>
                  <FontAwesomeIcon
                    className="icon-button"
                    icon="random"
                    onClick={() => {
                      // 更换 App
                      console.log(12312);
                    }}
                  />
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
                  value={currentApp?.name}
                  onChange={event => {
                    event.persist();
                    const { value } = event.target;
                    setCurrentApp({ ...currentApp, name: value });
                  }}
                />
              </div>
              <div className="config-item">
                <span className="title">类型</span>
                <select
                  className="select-item"
                  name="bucket"
                  id="bucket"
                  onChange={event => {
                    event.persist();
                    const { value } = event.target;
                    setCurrentApp({ ...currentApp, type: Number(value) });
                  }}
                >
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
                  value={currentApp?.ak}
                  onChange={event => {
                    event.persist();
                    const { value } = event.target;
                    setCurrentApp({ ...currentApp, ak: value });
                  }}
                />
              </div>
              <div className="config-item">
                <span className="title">sk</span>
                <Input
                  className="input-item"
                  placeholder="请输入相应服务商 sk"
                  value={currentApp?.sk}
                  onChange={event => {
                    event.persist();
                    const { value } = event.target;
                    setCurrentApp({ ...currentApp, sk: value });
                  }}
                />
              </div>
              {/* <div className="config-item"> */}
              {/*  <span className="title">bucket</span> */}
              {/*  <Input */}
              {/*    className="input-item" */}
              {/*    placeholder="请输入bucket" */}
              {/*    value={currentApp?.bucket} */}
              {/*  /> */}
              {/* </div> */}

              {/* <div className="config-item"> */}
              {/*  <span className="title">prefix</span> */}
              {/*  <Input */}
              {/*    className="input-item" */}
              {/*    placeholder="请输入 prefix" */}
              {/*    value={currentApp?.uploadPrefix} */}
              {/*  /> */}
              {/* </div> */}
            </div>
          ) : (
            <div>当前没有选中的 App</div>
          )}
          <div>
            <Button
              value="添加"
              onClick={() => {
                addApp(
                  currentApp!.name,
                  currentApp!.type,
                  currentApp!.ak,
                  currentApp!.sk
                ).then(() => {});
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Apps;
