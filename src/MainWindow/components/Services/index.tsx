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
import { debounce, deepEqual } from "../../helper/utils";

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

const Services = ({ activeApp, onAppSwitch }: PropTypes) => {
  const [apps, setApps] = useState<AppStore[]>([]);
  const [page, setPage] = useState<ServicesPage>(ServicesPage.list);
  const [direction, setDirection] = useState<Direction>(Direction.down);
  // 是否为中正在编辑的状态
  const [isEdit, setIsEdit] = useState<boolean>(false);
  // update form 中的数据是否已经被修改
  const [edited, setEdited] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const _toAddPage = () => {
    setPage(ServicesPage.add);
    setDirection(Direction.right);
  };
  const _toListPage = () => {
    setPage(ServicesPage.list);
    setDirection(Direction.left);
  };
  const onFormChange = debounce((values: any, app: any) => {
    const isEq = deepEqual(values, app);
    console.log("更新修改，是由与原来相同：", isEq);
    setEdited(!isEq);
  }, 200);
  const onBucketUpdate = async (store: AppStore) => {
    try {
      const combineStore = { ...activeApp, ...store };
      const { _id, type, ak, sk } = combineStore;
      // 检查新的 ak，sk 是否匹配
      await getBuckets({ type, ak, sk });
      // 修改数据库中的字段
      setLoading(true);
      await updateApp(combineStore);
      // 获取其新的 bucket 列表
      const allApps = await getAppsChannel();
      setApps(allApps);
      // 选择当前修改的 app，并且选中
      const currentStore = allApps.find(i => i._id === _id);
      if (currentStore) onAppSwitch(currentStore);
      setIsEdit(false);
      setEdited(false);
    } catch (e) {
      console.log("修改 app 时出错：", e);
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };
  const onBucketCancel = () => {
    setIsEdit(false);
    setEdited(false);
  };
  const onBucketDelete = async (app: AppStore) => {
    try {
      // 1、弹窗提示
      await showConfirm({ title: "删除", message: "确定要删除该应用吗？" });
      setLoading(true);
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
  const switchApp = async (id: string) => {
    // 1、判断点击的是否为选中的
    if (activeApp && activeApp._id === id) return;
    // 切换 app，判断是不是已经编辑
    // 已经编辑、打开确认窗口
    if (edited)
      await showConfirm({
        title: "通知",
        message: "更改还没有保存，是否要切换 app ？"
      });
    // 2、将编辑状态取消
    setEdited(false);
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
                    activeApp={activeApp}
                    onFormChange={(changedValues, values) => {
                      onFormChange(values, activeApp);
                    }}
                    onBucketUpdate={onBucketUpdate}
                    onBucketCancel={onBucketCancel}
                  />
                ) : (
                  <section>
                    <article>
                      <h1>基本信息：</h1>
                      <p>
                        <span>云服务厂商：</span>
                        <span>{activeApp.type || "暂无配置"}</span>
                      </p>
                      <p>
                        <span>AK：</span>
                        <span>{activeApp.ak || "暂无配置"}</span>
                      </p>
                      <p>
                        <span>SK：</span>
                        <span>
                          {hiddenTextFilter(activeApp.sk || "暂无配置")}
                        </span>
                      </p>
                    </article>
                    <article>
                      <h1>软件配置：</h1>
                      <p>
                        <span>默认上传路径：</span>
                        <span>{activeApp.uploadBucket || "暂无配置"}</span>
                      </p>
                      <p>
                        <span>默认上传前缀：</span>
                        <span>{activeApp.uploadPrefix || "暂无配置"}</span>
                      </p>
                      <p>
                        <span>默认域名：</span>
                        <span>{activeApp.defaultDomain || "暂无配置"}</span>
                      </p>
                    </article>
                    <article>
                      <h1>操作</h1>
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
                    </article>
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
