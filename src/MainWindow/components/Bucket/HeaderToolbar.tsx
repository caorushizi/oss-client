import React from "react";

import "./index.scss";
import { Button, Input, Breadcrumb, Space } from "antd";
import { NumberOutlined, MenuOutlined } from "@ant-design/icons";
import classNames from "classnames";
import BackIcon from "../../assets/images/back.png";
import ReloadIcon from "../../assets/images/reload.png";
import SearchIcon from "../../assets/images/search.png";
import GridIcon from "../../assets/images/grid.png";
import TableIcon from "../../assets/images/table.png";

import { Layout } from "../../helper/enums";

type PropTypes = {
  backspace: () => void;
  onChangeLayout: () => void;
  layout: Layout;
  navigators: string[];
  onSearchChange: (value: string) => void;
  onRefreshBucket: () => void;
};

const HeaderToolbar = ({
  backspace,
  layout,
  onChangeLayout,
  navigators,
  onSearchChange,
  onRefreshBucket
}: PropTypes) => {
  return (
    <div className="toolbar-wrapper">
      <Space size="middle" align="center" className="toolbar-left">
        <img
          className={classNames("back", { disabled: navigators.length === 0 })}
          role="presentation"
          src={BackIcon}
          alt=""
          onClick={backspace}
        />
        <img
          className="reload"
          role="presentation"
          src={ReloadIcon}
          alt=""
          onClick={onRefreshBucket}
        />
        <Breadcrumb>
          {["首页"].concat(navigators).map(item => (
            <Breadcrumb.Item key={item}>{item}</Breadcrumb.Item>
          ))}
        </Breadcrumb>
      </Space>
      <Space size="middle" align="center" className="toolbar-right">
        <Input
          size="small"
          prefix={<img src={SearchIcon} alt="" />}
          placeholder="搜索文件"
          onChange={event => onSearchChange(event.target.value)}
        />
        {layout === Layout.grid ? (
          <img
            role="presentation"
            className="mode-icon"
            src={GridIcon}
            onClick={onChangeLayout}
            alt=""
          />
        ) : (
          <img
            role="presentation"
            className="mode-icon"
            src={TableIcon}
            onClick={onChangeLayout}
            alt=""
          />
        )}
      </Space>
    </div>
  );
};

export default HeaderToolbar;
