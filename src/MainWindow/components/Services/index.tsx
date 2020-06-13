import React, { useEffect, useState } from "react";

import "./index.scss";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { Button, Space, Spin } from "antd";
import classNames from "classnames";
import { addApp, deleteApp, getAppsChannel, updateApp } from "../../helper/ipc";
import FormAdd from "./FormAdd";
import FormUpdate from "./FormUpdate";
import { AppStore, OssType } from "../../../main/types";
import useKeyPress from "../../hooks/useKeyPress";
import { Direction, KeyCode } from "../../helper/enums";
import { hiddenTextFilter } from "../../helper/filters";

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

const mainWrapperWidth = document.body.clientWidth - 225;
const mainWrapperHeight = document.body.clientHeight - 40;

const Services = ({ onOssActive }: PropTypes) => {
  const [apps, setApps] = useState<(AppStore | NewAppStore)[]>([]);
  const [currentApp, setCurrentApp] = useState<AppStore>();
  const [page, setPage] = useState<ServicesPage>(ServicesPage.list);
  const [direction, setDirection] = useState<Direction>(Direction.down);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTip, setLoadingTip] = useState<string>("");

  const _toAddPage = () => {
    setPage(ServicesPage.add);
    setDirection(Direction.right);
  };
  const _toListPage = () => {
    setPage(ServicesPage.list);
    setDirection(Direction.left);
  };

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
  const onBucketAdd = async (values: AddForm) => {
    try {
      const { name, type, ak, sk } = values;
      // 开始添加 app 流程
      // 1、将 app 名称、ak、sk和服务商名称添加到数据库
      const app = await addApp(name, type, ak, sk);
      console.log(app);
      // 2、获取 app 中所有的域名信息，并保存到数据库
      // 3、获取 app 中所有的 bucket 信息，并保存到数据库
      // 4、选择当前的 app 作为默认的 app
      // 5、返回上一页
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
      _toListPage();
    } catch (err) {
      console.error(err);
    }
  };
  const onOssSelect = (id: string) => {
    const ossList = apps.filter(i => i._id);
    setApps(ossList);
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

  const renderSwitch = (param: ServicesPage) => {
    switch (param) {
      case ServicesPage.list:
        return (
          <section className="apps-main-wrapper">
            <div className="main-left">
              <div className="header">
                <Button size="small" onClick={_toAddPage}>
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
                <div className="main-right_form_title">
                  {isEdit ? "修改配置" : "查看配置"}
                </div>
                {isEdit ? (
                  <FormUpdate
                    key={currentApp._id}
                    activeOss={currentApp}
                    onBucketUpdate={onBucketUpdate}
                    onBucketDelete={onBucketDelete}
                    onBucketCancel={() => {
                      setIsEdit(false);
                    }}
                  />
                ) : (
                  <section>
                    <div>
                      <div>基本信息：</div>
                      <div>
                        <span>云服务厂商：</span>
                        {currentApp.type || "暂无配置"}
                      </div>
                      <div>
                        <span>AK：</span>
                        {currentApp.ak || "暂无配置"}
                      </div>
                      <div>
                        <span>SK：</span>
                        {hiddenTextFilter(currentApp.sk || "暂无配置")}
                      </div>
                    </div>
                    <div>
                      <div>软件配置：</div>
                      <div>
                        <span>默认上传路径：</span>
                        {currentApp.uploadBucket || "暂无配置"}
                      </div>
                      <div>
                        <span>默认上传前缀：</span>
                        {currentApp.uploadPrefix || "暂无配置"}
                      </div>
                      <div>
                        <span>默认域名：</span>
                        {currentApp.defaultDomain || "暂无配置"}
                      </div>
                    </div>
                    <div>
                      <div>操作</div>
                      <Space>
                        <Button
                          onClick={() => {
                            setIsEdit(true);
                          }}
                          size="small"
                        >
                          编辑
                        </Button>
                        <Button
                          onClick={() => onBucketDelete(currentApp!)}
                          size="small"
                          danger
                        >
                          删除
                        </Button>
                      </Space>
                    </div>
                  </section>
                )}
              </div>
            )}
          </section>
        );
      case ServicesPage.add:
        return (
          <section className="apps-main-wrapper">
            <div className="main-left">
              <div className="header">
                <Button size="small" onClick={_toListPage}>
                  返回
                </Button>
              </div>
            </div>
            <div className="main-right_form_container">
              <div className="main-right_form_title">新增配置</div>
              <FormAdd onBucketAdd={onBucketAdd} />
            </div>
          </section>
        );
      default:
        return <div>123</div>;
    }
  };

  return (
    <Spin tip={loadingTip} spinning={loading}>
      <SwitchTransition>
        <CSSTransition
          key={page}
          addEndListener={(node, done) => {
            node.addEventListener("transitionend", done, false);
          }}
          classNames={direction}
        >
          <section
            className="services-wrapper"
            style={{
              width: mainWrapperWidth,
              maxWidth: mainWrapperWidth,
              height: mainWrapperHeight,
              maxHeight: mainWrapperHeight
            }}
          >
            {renderSwitch(page)}
          </section>
        </CSSTransition>
      </SwitchTransition>
    </Spin>
  );
};

export default Services;
