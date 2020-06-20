import React from "react";

import "./index.scss";
import { Button, Input, Breadcrumb, Space } from "antd";
import {
  SearchOutlined,
  NumberOutlined,
  MenuOutlined,
  ArrowLeftOutlined,
  RedoOutlined
} from "@ant-design/icons";

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
      <Space size="middle" className="toolbar-left">
        <Button
          size="small"
          onClick={backspace}
          disabled={navigators.length === 0}
        >
          <ArrowLeftOutlined />
        </Button>
        <Button size="small" onClick={onRefreshBucket}>
          <RedoOutlined />
        </Button>
        <Breadcrumb>
          {["首页"].concat(navigators).map(item => (
            <Breadcrumb.Item key={item}>{item}</Breadcrumb.Item>
          ))}
        </Breadcrumb>
      </Space>
      <Space size="middle" className="toolbar-right">
        <Input
          size="small"
          prefix={<SearchOutlined />}
          placeholder="搜索"
          onChange={event => onSearchChange(event.target.value)}
        />
        <Button size="small" onClick={onChangeLayout}>
          {layout === Layout.grid ? <MenuOutlined /> : <NumberOutlined />}
        </Button>
      </Space>
    </div>
  );
};

export default HeaderToolbar;
