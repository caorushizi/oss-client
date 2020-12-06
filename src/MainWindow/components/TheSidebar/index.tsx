import React, { useEffect, useState } from "react";
import "./index.scss";
import classNames from "classnames";
import { LoadingOutlined } from "@ant-design/icons";
import { Progress, Spin } from "antd";
import { ipcRenderer } from "electron";
import { Page } from "../../helper/enums";
import FileIcon from "../../assets/images/file.png";
import SettingIcon from "../../assets/images/setting.png";
import DoneIcon from "../../assets/images/done.png";
import DownloadIcon from "../../assets/images/download.png";
import AppsIcon from "../../assets/images/apps.png";

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

const TheSidebar: React.FC<PropTypes> = params => {
  const [progress, setProgress] = useState<number>(100);

  const activeTag = (page: Page, bucket: string) => {
    return bucket
      ? { active: params.activePage === page && params.activeBucket === bucket }
      : { active: params.activePage === page };
  };

  const onProgress = (e: any, progressList: ProgressItem[]) => {
    const total = progressList.reduce((pre, cur) => pre + cur.progress, 0);
    setProgress(total / progressList.length);
  };

  useEffect(() => {
    ipcRenderer.on("transfer-progress", onProgress);

    return () => {
      ipcRenderer.removeListener("transfer-progress", onProgress);
    };
  }, []);

  return (
    <div className="the-sidebar-wrapper" style={{ background: params.color }}>
      <section className="title-bar">
        <span>OSS Client</span>
      </section>
      <section className="container">
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
      </section>
      <section className="container">
        <div className="title">
          <div className="text">传输列表</div>
          <Progress
            className="loading"
            type="circle"
            showInfo={false}
            percent={progress}
            width={15}
            strokeWidth={20}
          />
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
      </section>
      <section className="container">
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
      </section>
    </div>
  );
};

export default TheSidebar;
