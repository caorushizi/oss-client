import React, { useEffect, useState } from "react";

import "./index.scss";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { Button } from "antd";
import classNames from "classnames";
import { addApp, deleteApp, getAppsChannel, updateApp } from "../../helper/ipc";
import FormAdd from "./FormAdd";
import FormUpdate from "./FormUpdate";
import { AppStore, OssType } from "../../../main/types";
import useKeyPress from "../../hooks/useKeyPress";
import { Direction, KeyCode } from "../../helper/enums";

type NewAppStore = {
  _id?: string;
  type: OssType;
  ak: string;
  sk: string;
  name: string;
  bucket: string;
  uploadBucket: string;
  uploadPrefix: string;
  defaultDomain: string;
  isNew: boolean;
};

type PropTypes = {
  onOssActive: (item: AppStore) => void;
};

enum ServicesPage {
  list,
  add
}

const Services = ({ onOssActive }: PropTypes) => {
  const [apps, setApps] = useState<(AppStore | NewAppStore)[]>([]);
  const [currentApp, setCurrentApp] = useState<AppStore>();
  const [hasNew, setHasNew] = useState<boolean>(false);
  const [page, setPage] = useState<ServicesPage>(ServicesPage.list);
  const [direction, setDirection] = useState<Direction>(Direction.down);
  const escapePress = useKeyPress(KeyCode.Escape);

  const onBucketUpdate = async (store: AppStore) => {
    await updateApp(store);
    const allApps = await getAppsChannel();
    setApps(allApps);
    const currentStore = allApps.find(i => i._id === store._id);
    if (currentStore) {
      onOssActive(currentStore);
      setCurrentApp(currentStore);
    }
  };
  const onBucketDelete = async (store: AppStore) => {
    await deleteApp(store);
    const allApps = await getAppsChannel();
    setApps(allApps);
    setCurrentApp(allApps[0]);
    onOssActive(allApps[0]);
  };
  const onBucketAdd = async (
    name: string,
    ak: string,
    sk: string,
    type: OssType
  ) => {
    await addApp(name, type, ak, sk);
    const allApps = await getAppsChannel();
    setApps(allApps);
    const addedApp = allApps.find(i => i.sk === sk);
    if (addedApp) {
      setCurrentApp(addedApp);
      onOssActive(addedApp);
    } else {
      setCurrentApp(allApps[0]);
      onOssActive(allApps[0]);
    }
    setHasNew(false);
  };
  const onOssAddClick = () => {
    // if (apps.filter(i => (i as NewAppStore).isNew).length > 0) return;
    // const current: NewAppStore = {
    //   name: "新建",
    //   ak: "",
    //   sk: "",
    //   type: OssType.qiniu,
    //   bucket: "",
    //   uploadPrefix: "",
    //   uploadBucket: "",
    //   defaultDomain: "",
    //   isNew: true
    // };
    // setApps([...apps, current]);
    // setCurrentApp(current);
    // setHasNew(true);
    setPage(ServicesPage.add);
    setDirection(Direction.right);
  };
  const onOssSelect = (id: string) => {
    const ossList = apps.filter(i => i._id);
    setApps(ossList);
    setHasNew(false);
    const selected = ossList.find(i => i._id === id);
    if (selected) {
      setCurrentApp(selected);
      onOssActive(selected);
    }
  };

  useEffect(() => {
    const initState = async () => {
      const allApps = await getAppsChannel();
      setApps(allApps);
      setCurrentApp(allApps[0]);
    };
    initState().then(r => r);
  }, []);

  useEffect(() => {
    const ossList = apps.filter(i => i._id);
    if (ossList.length > 0) {
      setApps(ossList);
      setHasNew(false);
      setCurrentApp(ossList[0]);
      onOssActive(ossList[0]);
    }
  }, [escapePress]);
  // fixme: 在上下切换的时候宽度增加

  const renderIcon = (type: OssType) => {
    switch (type) {
      case OssType.ali:
        return <use xlinkHref="#icon-aliyun-logo" />;
      case OssType.qiniu:
        return <use xlinkHref="#icon-qiniuyun1" />;
      case OssType.tencent:
        return <use xlinkHref="#icon-tengxunyun" />;
      default:
        return <use xlinkHref="#icon-grid" />;
    }
  };

  return (
    <div className="services-wrapper">
      <TransitionGroup>
        {page === ServicesPage.list && (
          <CSSTransition
            key="service-list"
            style={{ background: "red" }}
            addEndListener={(node, done) => {
              node.addEventListener("transitionend", done, false);
            }}
            classNames={direction}
          >
            <section className="apps-main">
              <div className="main-left">
                <div className="header">
                  <Button
                    size="small"
                    disabled={hasNew}
                    onClick={onOssAddClick}
                  >
                    添加
                  </Button>
                </div>
                <ul className="app-list">
                  {apps.length > 0 ? (
                    apps.map(app => (
                      <li
                        className={classNames("item", {
                          active: app._id === currentApp?._id
                        })}
                        key={app._id || Date.now()}
                      >
                        <button
                          type="button"
                          className="button"
                          disabled={!app._id}
                          onClick={() => onOssSelect(app._id!)}
                        >
                          <svg className="icon" aria-hidden="true">
                            {renderIcon(app.type)}
                          </svg>
                          <span>{app.name}</span>
                        </button>
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
              {currentApp && (
                <div className="main-right_form_container">
                  <div className="main-right_form_title">修改配置</div>
                  <FormUpdate
                    key={currentApp._id}
                    activeOss={currentApp}
                    onBucketUpdate={onBucketUpdate}
                    onBucketDelete={onBucketDelete}
                  />
                </div>
              )}
            </section>
          </CSSTransition>
        )}
        {page === ServicesPage.add && (
          <CSSTransition
            key="service-add"
            style={{ background: "green" }}
            addEndListener={(node, done) => {
              node.addEventListener("transitionend", done, false);
            }}
            classNames={direction}
          >
            <div>
              <Button
                size="small"
                onClick={() => {
                  setPage(ServicesPage.list);
                  setDirection(Direction.left);
                }}
              >
                返回
              </Button>
              <FormAdd onBucketAdd={onBucketAdd} />
            </div>
          </CSSTransition>
        )}
      </TransitionGroup>
    </div>
  );
};

export default Services;
