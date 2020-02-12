import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { switchLayout } from "../../store/app/actions";
import { Layout } from "../../store/app/types";
import Breadcrumb from "../Breadcrumb";
import Input from "../Input";
import "./index.scss";

const ToolBar = () => {
  const dispatch = useDispatch();
  const selectLayout = (state: RootState) => state.app.layout;
  const layout = useSelector(selectLayout);

  return (
    <div className="toolbar-wrapper">
      <div className="toolbar-left">
        <FontAwesomeIcon icon="angle-left" className="icon-button" />
        <FontAwesomeIcon icon="undo-alt" className="icon-button" />
        <Breadcrumb routes={["1", "2", "3"]} />
      </div>
      <div className="toolbar-right">
        <Input icon="search" placeholder="搜索" />
        {Layout.grid === layout ? (
          // grid
          <FontAwesomeIcon
            icon="bars"
            onClick={() => dispatch(switchLayout(Layout.table))}
            className="icon-button"
          />
        ) : (
          // table
          <FontAwesomeIcon
            icon="border-all"
            onClick={() => dispatch(switchLayout(Layout.grid))}
            className="icon-button"
          />
        )}
      </div>
    </div>
  );
};

export default ToolBar;
