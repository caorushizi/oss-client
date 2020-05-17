import React from "react";
import "./index.scss";
import classNames from "classnames";
import {
  FolderFilled,
  ArrowUpOutlined,
  CheckCircleFilled,
  SettingFilled,
  AppstoreFilled,
  MinusCircleOutlined,
  LoadingOutlined
} from "@ant-design/icons";
import { Spin } from "antd";
import { Page } from "../../helper/enums";

const antIcon = <LoadingOutlined style={{ fontSize: 12 }} spin />;

type PropTypes = {
  bucketList: string[];
  bucketLoading: boolean;
  activeBucket: string;
  activePage: Page;
  tabChange: (page: Page, bucket?: string) => void;
  color: string;
};

function TheSidebar({
  bucketList,
  bucketLoading,
  activeBucket,
  activePage,
  tabChange,
  color
}: PropTypes) {
  const activeTag = (page: Page, bucket?: string) => {
    if (bucket) {
      return { active: activePage === page && activeBucket === bucket };
    }
    return { active: activePage === page };
  };

  return (
    <div className="the-sidebar-wrapper" style={{ background: color }}>
      <section className="title-bar">
        <span>OSS Client</span>
      </section>
      <section className="container">
        <div className="title">
          <div className="text">储存空间</div>
          <Spin
            className="loading"
            indicator={antIcon}
            spinning={bucketLoading}
          />
        </div>
        <ul className="sidebar-list">
          {bucketList.length ? (
            bucketList.map((bucket: string) => (
              <li
                className={classNames("item", activeTag(Page.bucket, bucket))}
                key={bucket}
              >
                <FolderFilled className="icon" />
                <input
                  type="button"
                  className="link"
                  onClick={() => tabChange(Page.bucket, bucket)}
                  title={bucket}
                  value={bucket}
                />
              </li>
            ))
          ) : (
            <li className="item">
              <MinusCircleOutlined className="icon" />
              <button type="button" className="link disabled" disabled>
                暂无储存桶
              </button>
            </li>
          )}
        </ul>
      </section>
      <section className="container">
        <div className="title">
          <div className="text">传输列表</div>
        </div>
        <ul className="sidebar-list">
          <li className={classNames("item", activeTag(Page.transferList))}>
            <ArrowUpOutlined className="icon" />
            <input
              type="button"
              value="传输列表"
              className="link"
              onClick={() => tabChange(Page.transferList)}
            />
          </li>
          <li className={classNames("item", activeTag(Page.transferDone))}>
            <CheckCircleFilled className="icon" />
            <input
              type="button"
              value="传输完成"
              className="link"
              onClick={() => tabChange(Page.transferDone)}
            />
          </li>
        </ul>
      </section>
      <section className="container">
        <div className="title">
          <div className="text">设置</div>
        </div>
        <ul className="sidebar-list">
          <li className={classNames("item", activeTag(Page.setting))}>
            <SettingFilled className="icon" />
            <input
              type="button"
              value="设置"
              className="link"
              onClick={() => tabChange(Page.setting)}
            />
          </li>
          <li className={classNames("item", activeTag(Page.services))}>
            <AppstoreFilled className="icon" />
            <input
              type="button"
              value="apps"
              className="link"
              onClick={() => tabChange(Page.services)}
            />
          </li>
        </ul>
      </section>
    </div>
  );
}

export default TheSidebar;
