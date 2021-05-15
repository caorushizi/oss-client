import React, { useEffect, useState } from "react";
import "./index.scss";
import classNames from "classnames";
import { LoadingOutlined } from "@ant-design/icons";
import { Progress, Spin } from "antd";
import { Page } from "renderer/helper/enums";
import FileIcon from "renderer/assets/images/file.png";
import SettingIcon from "renderer/assets/images/setting.png";
import DoneIcon from "renderer/assets/images/done.png";
import DownloadIcon from "renderer/assets/images/download.png";
import AppsIcon from "renderer/assets/images/apps.png";

const antIcon = <LoadingOutlined style={{ fontSize: 12 }} spin />;

type PropTypes = {
  bucketList: string[];
  bucketLoading: boolean;
  activeBucket: string;
  activePage: Page;
  tabChange: (page: Page, bucket: string) => void;
  color: string;
};

type ProgressItem = {
  id: string;
  progress: number;
};

const TheSidebar: React.FC<PropTypes> = (params) => {
  const [progress, setProgress] = useState<number>(0);
  const [showProgress, setShowProgress] = useState<boolean>(false);

  const activeTag = (page: Page, bucket: string) => {
    return bucket
      ? { active: params.activePage === page && params.activeBucket === bucket }
      : { active: params.activePage === page };
  };

  const onProgress = (e: any, progressList: ProgressItem[]) => {
    setShowProgress(true);
    const total = progressList.reduce((pre, cur) => pre + cur.progress, 0);
    setProgress(total / progressList.length);
  };

  const onFinish = () => {
    setProgress(100);
    setTimeout(() => setShowProgress(false), 200);
  };

  useEffect(() => {
    window.electron.onIpcEvent("transfer-progress", onProgress);
    window.electron.onIpcEvent("transfer-finish", onFinish);

    return () => {
      window.electron.removeIpcEvent("transfer-progress", onProgress);
      window.electron.removeIpcEvent("transfer-finish", onFinish);
    };
  }, []);

  return (
    <div className="the-sidebar-wrapper" style={{ background: params.color }}>
      <div className="title-bar">
        <span>OSS Client</span>
      </div>
      <div className="sidebar-container">
        <div className="title">
          <div className="text">储存空间</div>
          <Spin
            className="loading"
            indicator={antIcon}
            spinning={params.bucketLoading}
          />
        </div>
        <ul className="sidebar-list">
          {params.bucketList.length ? (
            params.bucketList.map((bucket: string) => (
              <div
                role="presentation"
                className={classNames("item", activeTag(Page.bucket, bucket))}
                key={bucket}
                onClick={() => params.tabChange(Page.bucket, bucket)}
              >
                <img className="icon" src={FileIcon} alt="" />
                <div className="name" title={bucket}>
                  {bucket}
                </div>
              </div>
            ))
          ) : (
            <li className="item disabled">
              <img className="icon" src={FileIcon} alt="" />
              <div className="name">暂无储存桶</div>
            </li>
          )}
        </ul>
      </div>
      <div className="sidebar-container">
        <div className="title">
          <div className="text">传输列表</div>
          {showProgress && (
            <Progress
              className="loading"
              type="circle"
              showInfo={false}
              percent={progress}
              width={15}
              strokeWidth={20}
            />
          )}
        </div>
        <div className="sidebar-list">
          <div
            role="presentation"
            onClick={() => params.tabChange(Page.transferList, "")}
            className={classNames("item", activeTag(Page.transferList, ""))}
          >
            <img className="icon" src={DownloadIcon} alt="" />
            <div className="name">传输列表</div>
          </div>
          <div
            role="presentation"
            onClick={() => params.tabChange(Page.transferDone, "")}
            className={classNames("item", activeTag(Page.transferDone, ""))}
          >
            <img className="icon" src={DoneIcon} alt="" />
            <div className="name">传输完成</div>
          </div>
        </div>
      </div>
      <div className="sidebar-container">
        <div className="title">
          <div className="text">设置</div>
        </div>
        <div className="sidebar-list">
          <div
            role="presentation"
            onClick={() => params.tabChange(Page.setting, "")}
            className={classNames("item", activeTag(Page.setting, ""))}
          >
            <img className="icon" src={SettingIcon} alt="" />
            <div className="name">设置</div>
          </div>
          <div
            role="presentation"
            onClick={() => params.tabChange(Page.services, "")}
            className={classNames("item", activeTag(Page.services, ""))}
          >
            <img className="icon" src={AppsIcon} alt="" />
            <div className="name">apps</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheSidebar;