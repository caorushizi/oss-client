import React from "react";
import Icon from "../Icon";
import stopIcon from "./images/stop.png";
import terminateIcon from "./images/terminate.png";
import folderIcon from "./images/folder.png";

import "./index.scss";

const TransformItem = () => (
  <li className="transform-item">
    <div className="sub">
      <Icon />
      <div>
        <div className="name">testtesttest.css</div>
        <div className="size">55MB</div>
      </div>
    </div>
    <img className="icon" src={stopIcon} alt="stop" />
    <img className="icon" src={terminateIcon} alt="terminateIcon" />
    <img className="icon" src={folderIcon} alt="folderIcon" />
    <i className="fas fa-camera">123</i>
  </li>
);

const Transform = () => {
  return (
    <div className="transform-wrapper">
      <ul className="transform-list">
        <TransformItem />
        <TransformItem />
      </ul>
    </div>
  );
};

export default Transform;
