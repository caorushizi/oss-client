import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Icon from "../Icon";
import "./index.scss";

const TransformItem = () => (
  <li className="transform-item">
    <div className="sub">
      <Icon filename="testtesttest.css" />
      <div>
        <div className="name">testtesttest.css</div>
        <div className="size">55MB</div>
      </div>
    </div>
    <FontAwesomeIcon className="icon" icon="pause" />
    <FontAwesomeIcon className="icon" icon="trash-alt" />
    <FontAwesomeIcon className="icon" icon="folder" />
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
