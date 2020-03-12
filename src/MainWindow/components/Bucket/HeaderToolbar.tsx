import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./index.scss";
import { Layout } from "../../store/app/types";
import Breadcrumb from "../BaseBreadcrumb";
import Input from "../BaseInput";

type PropTypes = {
  backspace: () => void;
  changeLayout: () => void;
  layout: Layout;
  navigators: string[];
};

const HeaderToolbar = ({
  backspace,
  layout,
  changeLayout,
  navigators
}: PropTypes) => {
  return (
    <div className="toolbar-wrapper">
      <div className="toolbar-left">
        <FontAwesomeIcon icon="angle-left" onClick={backspace} />
        <FontAwesomeIcon icon="undo-alt" />
        <Breadcrumb routes={["首页"].concat(navigators)} />
      </div>
      <div className="toolbar-right">
        <Input icon="search" placeholder="搜索" />
        <FontAwesomeIcon
          icon={layout === Layout.grid ? "bars" : "border-all"}
          onClick={changeLayout}
          className="icon-button"
        />
      </div>
    </div>
  );
};

export default HeaderToolbar;
