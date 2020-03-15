import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./index.scss";
import { Layout } from "../../types";
import Breadcrumb from "../BaseBreadcrumb";
import Input from "../BaseInput";
import Button from "../BaseButton";

type PropTypes = {
  backspace: () => void;
  changeLayout: () => void;
  layout: Layout;
  navigators: string[];
  onSearchChange: (value: string) => void;
};

const HeaderToolbar = ({
  backspace,
  layout,
  changeLayout,
  navigators,
  onSearchChange
}: PropTypes) => {
  return (
    <div className="toolbar-wrapper">
      <div className="toolbar-left">
        <Button icon="arrow-left" onClick={backspace} />
        <Button icon="undo-alt" />
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
          onClick={changeLayout}
        />
      </div>
    </div>
  );
};

export default HeaderToolbar;
