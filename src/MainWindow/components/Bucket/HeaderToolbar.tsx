import React from "react";

import "./index.scss";
import { Button, Input, Breadcrumb } from "antd";
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
      <div className="toolbar-left">
        <Button onClick={backspace}>返回</Button>
        <Button onClick={onRefreshBucket}>刷新</Button>
        <Breadcrumb>
          {["首页"].concat(navigators).map(item => (
            <Breadcrumb.Item key={item}>{item}</Breadcrumb.Item>
          ))}
        </Breadcrumb>
      </div>
      <div className="toolbar-right">
        <Input
          className="toolbar-right__search"
          // icon="search"
          placeholder="搜索"
          onChange={event => onSearchChange(event.target.value)}
        />
        <Button onClick={onChangeLayout}>
          {layout === Layout.grid ? "表格" : "栅格"}
        </Button>
      </div>
    </div>
  );
};

export default HeaderToolbar;
