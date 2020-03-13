import React, { useEffect, useState } from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./index.scss";
import Button from "../BaseButton";
import { AppStore } from "../../../main/store/apps";

type PropTypes = {
  activeOss?: string;
  ossList: AppStore[];
  onOssAddClick: () => void;
  onOssSelect: (id: string) => void;
  onOssChange: () => void;
};

const ServicesList = ({
  activeOss,
  ossList,
  onOssAddClick,
  onOssSelect,
  onOssChange
}: PropTypes) => {
  return (
    <div className="main-left">
      <div className="header">
        <Button value="添加" onClick={onOssAddClick} />
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
                onClick={() => onOssSelect(app._id!)}
              >
                <svg className="icon" aria-hidden="true">
                  <use xlinkHref="#icon-qiniuyun1" />
                </svg>
                <span>{app.name}</span>
              </button>
              <FontAwesomeIcon
                className="icon-button"
                icon="random"
                onClick={onOssChange}
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
  );
};
export default ServicesList;
