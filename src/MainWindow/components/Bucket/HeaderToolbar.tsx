import React from "react";

import "./index.scss";
import { Layout } from "../../helper/enums";
import Breadcrumb from "../BaseBreadcrumb";
import Input from "../BaseInput";
import Button from "../BaseButton";

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
        <Button icon="arrow-left" onClick={backspace} />
        <Button icon="undo-alt" onClick={onRefreshBucket} />
        <Breadcrumb routes={["首页"].concat(navigators)} />
      </div>
      <div className="toolbar-right">
        <Input
          className="toolbar-right__search"
          icon="search"
          placeholder="搜索"
          onChange={event => onSearchChange(event.target.value)}
        />
        <Button
          icon={layout === Layout.grid ? "bars" : "border-all"}
          onClick={onChangeLayout}
        />
      </div>
    </div>
  );
};

export default HeaderToolbar;
