import React, { useEffect, useState } from "react";

import "./index.scss";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { Button, Col, message, Row, Space, Spin } from "antd";
import classNames from "classnames";
import {
  addApp,
  changeSetting,
  deleteApp,
  getAppsChannel,
  getBuckets,
  showConfirm,
  updateApp
} from "../../helper/ipc";
import FormAdd from "./FormAdd";
import FormUpdate from "./FormUpdate";
import { Direction } from "../../helper/enums";
import { hiddenTextFilter } from "../../helper/filters";
import { debounce, deepEqual } from "../../helper/utils";
import NoResult from "../NoResult";

enum OssType {
  qiniu,
  ali,
  tencent
}

const OssTypeMap = {
  [OssType.qiniu]: "七牛云",
  [OssType.ali]: "阿里云",
  [OssType.tencent]: "腾讯云"
};

type PropTypes = {
  onAppSwitch: (item: AppStore) => void;
  activeApp?: AppStore;
};

enum ServicesPage {
  list,
  add
}

const Services = ({ activeApp, onAppSwitch }: PropTypes) => {
  const [apps, setApps] = useState<AppStore[]>([]);
  const [page, setPage] = useState<ServicesPage>(ServicesPage.list);
  const [direction, setDirection] = useState<Direction>(Direction.left);
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
      // 判断数据库中是否还有数据
      setApps(allApps);

      onAppSwitch(allApps[0]);
    } catch (err) {
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
      // 2、获取存储区域，并保存到数据库
      // 3、将 app 名称、ak、sk和服务商名称添加到数据库
      const app = await addApp(name, type, ak, sk);
      // 4、选择当前的 app 作为默认的 app
      const allApps = await getAppsChannel();
      setApps(allApps);
      const addedApp = allApps.find(i => i.sk === sk);
      if (!addedApp) throw new Error("保存 app 失败");
      onAppSwitch(addedApp);
      // 5、返回上一页
      _toListPage();
      message.success("添加成功");
    } catch (err) {
      message.error(`添加失败：${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  const switchApp = async (id: string) => {
    try {
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
      // 4、设置默认选中的 appid
      await changeSetting("currentAppId", id);
    } catch (e) {
      message.error(e.message);
    }
  };
  const initState = async () => {
    // 获取所有 app 信息
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
        return apps.length > 0 ? (
          <Row className="apps-main-wrapper">
            <Col span={8} className="main-left">
              <div className="header">
                <Button size="small" onClick={_toAddPage}>
                  添加
                </Button>
              </div>
              <ul className="app-list">
                {apps.map(app => (
                  <li
                    className={classNames("item", {
                      active: app._id === activeApp?._id
                    })}
                    key={app._id || Date.now()}
                  >
                    <div
                      role="presentation"
                      className="button"
                      onClick={() => switchApp(app._id!)}
                    >
                      <svg className="icon" aria-hidden="true">
                        {renderIcon(app.type)}
                      </svg>
                      <span>{app.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </Col>
            {activeApp && (
              <Col span={16} className="main-right_form_container">
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
                  <section className="app-description">
                    <article className="app-description-section">
                      <h1 className="app-description-section_title">
                        基本信息：
                      </h1>
                      <p className="app-description-section_item">
                        <span className="app-description-section_item__title">
                          云服务厂商：
                        </span>
                        <span className="app-description-section_item__content">
                          {OssTypeMap[activeApp.type] || "暂无配置"}
                        </span>
                      </p>
                      <p className="app-description-section_item">
                        <span className="app-description-section_item__title">
                          AK：
                        </span>
                        <span className="app-description-section_item__content">
                          {activeApp.ak || "暂无配置"}
                        </span>
                      </p>
                      <p className="app-description-section_item">
                        <span className="app-description-section_item__title">
                          SK：
                        </span>
                        <span className="app-description-section_item__content">
                          {hiddenTextFilter(activeApp.sk || "暂无配置")}
                        </span>
                      </p>
                    </article>
                    <article className="app-description-section">
                      <h1 className="app-description-section_title">
                        软件配置：
                      </h1>
                      <p className="app-description-section_item">
                        <span className="app-description-section_item__title">
                          默认上传路径：
                        </span>
                        <span className="app-description-section_item__content">
                          {activeApp.uploadBucket || "暂无配置"}
                        </span>
                      </p>
                      <p className="app-description-section_item">
                        <span className="app-description-section_item__title">
                          默认上传前缀：
                        </span>
                        <span className="app-description-section_item__content">
                          {activeApp.uploadPrefix || "暂无配置"}
                        </span>
                      </p>
                      <p className="app-description-section_item">
                        <span className="app-description-section_item__title">
                          默认域名：
                        </span>
                        <span className="app-description-section_item__content">
                          {activeApp.defaultDomain || "暂无配置"}
                        </span>
                      </p>
                    </article>
                    <article className="app-description-section">
                      <h1 className="app-description-section_title">操作</h1>
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
              </Col>
            )}
          </Row>
        ) : (
          <section className="apps-main-wrapper">
            <NoResult title="没有 Apps" subTitle="暂时没有搜索到 apps">
              <Button size="small" onClick={_toAddPage}>
                添加
              </Button>
            </NoResult>
          </section>
        );
      case ServicesPage.add:
        return (
          <Row className="apps-main-wrapper">
            <Col span={8} className="main-left">
              <div className="header">
                <Button size="small" onClick={_toListPage}>
                  返回
                </Button>
              </div>
            </Col>
            <Col span={16} className="main-right_form_container">
              <div className="main-right_form_title">新增配置</div>
              <FormAdd onBucketAdd={onBucketAdd} />
            </Col>
          </Row>
        );
      default:
        return "";
    }
  };

  return (
    <Spin spinning={loading} size="large" wrapperClassName="services-loading">
      <SwitchTransition>
        <CSSTransition
          key={page}
          addEndListener={(node, done) => {
            node.addEventListener("transitionend", done, false);
          }}
          classNames={direction}
        >
          <section className="services-wrapper">{renderSwitch(page)}</section>
        </CSSTransition>
      </SwitchTransition>
    </Spin>
  );
};

export default Services;
