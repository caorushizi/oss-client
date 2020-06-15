import React, { useEffect, useState } from "react";

import "./index.scss";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { Spin, message, Button, Space } from "antd";
import classNames from "classnames";
import {
  addApp,
  deleteApp,
  getAppsChannel,
  getBuckets,
  showConfirm,
  updateApp
} from "../../helper/ipc";
import FormAdd from "./FormAdd";
import FormUpdate from "./FormUpdate";
import { AppStore, OssType } from "../../../main/types";
import { Direction } from "../../helper/enums";
import { hiddenTextFilter } from "../../helper/filters";

type PropTypes = {
  onAppSwitch: (item: AppStore) => void;
  activeApp?: AppStore;
};

enum ServicesPage {
  list,
  add
}

const mainWrapperWidth = document.body.clientWidth - 225;
const mainWrapperHeight = document.body.clientHeight - 40;

const Services = ({ onAppSwitch, activeApp }: PropTypes) => {
  const [apps, setApps] = useState<AppStore[]>([]);
  const [page, setPage] = useState<ServicesPage>(ServicesPage.list);
  const [direction, setDirection] = useState<Direction>(Direction.down);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

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
      onAppSwitch(currentStore);
    }
  };
  const onBucketDelete = async (app: AppStore) => {
    try {
      setLoading(true);
      // 1、弹窗提示
      await showConfirm({ title: "删除", message: "确定要删除该应用吗？" });
      // 2、点击确定开始删除 app
      const id = app._id;
      await deleteApp(id);
      const allApps = await getAppsChannel();
      setApps(allApps);
      onAppSwitch(allApps[0]);
    } catch (err) {
      console.log("删除时出现错误：", err.message);
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  const onBucketAdd = async (values: AddForm) => {
    try {
      setLoading(true);
      const { name, type, ak, sk } = values;
      // 开始添加 app 流程
      // 1、获取 app 中所有的 bucket 信息，并保存到数据库（验证 ak，sk 是否可用）
      const buckets = await getBuckets({ type, ak, sk });
      console.log(buckets);
      // 2、获取存储区域，并保存到数据库
      // 3、将 app 名称、ak、sk和服务商名称添加到数据库
      const app = await addApp(name, type, ak, sk);
      console.log(app);
      // 4、选择当前的 app 作为默认的 app
      const allApps = await getAppsChannel();
      console.log(allApps);
      setApps(allApps);
      const addedApp = allApps.find(i => i.sk === sk);
      if (!addedApp) throw new Error("保存 app 失败");
      onAppSwitch(addedApp);
      // 5、返回上一页
      _toListPage();
      message.success("添加成功");
    } catch (err) {
      message.error(`添加失败：${err.message}`);
      console.log("添加 app 时出错：", err.message);
    } finally {
      setLoading(false);
    }
  };
  const switchApp = (id: string) => {
    // 1、判断点击的是否为选中的
    if (activeApp && activeApp._id === id) return;
    // 2、将编辑状态取消
    setIsEdit(false);
    // 3、选中点击的 app
    const selected = apps.find(i => i._id === id);
    if (selected) onAppSwitch(selected);
  };
  const initState = async () => {
    const allApps = await getAppsChannel();
    setApps(allApps);
  };
  useEffect(() => {
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
                        active: app._id === activeApp?._id
                      })}
                      key={app._id || Date.now()}
                    >
                      <button
                        type="button"
                        className="button"
                        disabled={!app._id}
                        onClick={() => switchApp(app._id!)}
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
            {activeApp && (
              <div className="main-right_form_container">
                <div className="main-right_form_title">
                  {isEdit ? "修改配置" : "查看配置"}
                </div>
                {isEdit ? (
                  <FormUpdate
                    key={activeApp.name}
                    activeOss={activeApp}
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
                        {activeApp.type || "暂无配置"}
                      </div>
                      <div>
                        <span>AK：</span>
                        {activeApp.ak || "暂无配置"}
                      </div>
                      <div>
                        <span>SK：</span>
                        {hiddenTextFilter(activeApp.sk || "暂无配置")}
                      </div>
                    </div>
                    <div>
                      <div>软件配置：</div>
                      <div>
                        <span>默认上传路径：</span>
                        {activeApp.uploadBucket || "暂无配置"}
                      </div>
                      <div>
                        <span>默认上传前缀：</span>
                        {activeApp.uploadPrefix || "暂无配置"}
                      </div>
                      <div>
                        <span>默认域名：</span>
                        {activeApp.defaultDomain || "暂无配置"}
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
                          onClick={() => onBucketDelete(activeApp)}
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
    <Spin spinning={loading}>
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
