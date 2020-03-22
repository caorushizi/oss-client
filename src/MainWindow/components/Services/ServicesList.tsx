import React, { useEffect, useState } from "react";
import classNames from "classnames";

import "./index.scss";
import Button from "../BaseButton";
import { AppStore } from "../../../main/store/apps";
import { OssType } from "../../../main/types";

type PropTypes = {
  activeOss?: string;
  ossList: AppStore[];
  onOssAddClick: () => void;
  onOssSelect: (id: string) => void;
  hasNew: boolean;
};

const ServicesList = ({
  activeOss,
  ossList,
  onOssAddClick,
  onOssSelect,
  hasNew = false
}: PropTypes) => {
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
    <div className="main-left">
      <div className="header">
        <Button value="添加" disabled={hasNew} onClick={onOssAddClick} />
      </div>
      <ul className="app-list">
        {ossList.length > 0 ? (
          ossList.map(app => (
            <li
              className={classNames("item", { active: app._id === activeOss })}
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
  );
};
export default ServicesList;
