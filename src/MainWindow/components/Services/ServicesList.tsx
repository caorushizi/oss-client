import React from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./index.scss";
import Button from "../BaseButton";

type PropTypes = {
  activeOssAk: string;
  ossList: any[];
  onOssAddClick: () => void;
  onOssSelect: () => void;
  onOssChange: () => void;
};

const ServicesList = ({
  activeOssAk,
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
          ossList.map((app, index) => (
            <li
              className={classNames("item", {
                active: app.ak === activeOssAk
              })}
              key={`${app.name}${Date.now()}`}
            >
              <button type="button" className="button" onClick={onOssSelect}>
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
