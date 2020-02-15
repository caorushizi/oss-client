import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Vdir } from "../../lib/vdir";
import { RootState } from "../../store";
import { changeNotifier, switchLayout } from "../../store/app/actions";
import { Layout } from "../../store/app/types";
import Breadcrumb from "../Breadcrumb";
import Input from "../Input";
import "./index.scss";

const ToolBar = ({ vdir }: { vdir: Vdir }) => {
  const dispatch = useDispatch();
  const selectLayout = (state: RootState) => state.app.layout;
  const layout = useSelector(selectLayout);

  const selectNotifier = (state: RootState) => state.app.notifier;
  const notifier = useSelector(selectNotifier);

  const [nav, setNav] = useState<string[]>([]);

  useEffect(() => {
    setNav(vdir.getNav());
  }, [notifier]);

  return (
    <div className="toolbar-wrapper">
      <div className="toolbar-left">
        <FontAwesomeIcon
          icon="angle-left"
          className="icon-button"
          onClick={() => {
            dispatch(changeNotifier());
            vdir.back();
          }}
        />
        <FontAwesomeIcon icon="undo-alt" className="icon-button" />
        <Breadcrumb routes={["首页"].concat(nav)} />
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
