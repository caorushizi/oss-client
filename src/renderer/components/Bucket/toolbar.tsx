import React from "react";
import "./index.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { Layout } from "../../store/app/types";
import { switchLayout } from "../../store/app/actions";

const ToolBar = () => {
  const dispatch = useDispatch();
  const selectLayout = (state: RootState) => state.app.layout;
  const layout = useSelector(selectLayout);

  return (
    <div className="toolbar-wrapper">
      <FontAwesomeIcon icon="angle-left" className="fa-button" />
      <FontAwesomeIcon icon="undo-alt" className="fa-button" />
      <div>搜索</div>
      {Layout.grid === layout ? (
        // grid
        <FontAwesomeIcon
          icon="bars"
          onClick={() => {
            console.log(123123);
            dispatch(switchLayout(Layout.table));
          }}
          className="fa-button"
        />
      ) : (
        // table
        <FontAwesomeIcon
          icon="border-all"
          onClick={() => {
            console.log(123123);
            console.log(123123);
            dispatch(switchLayout(Layout.grid));
          }}
          className="fa-button"
        />
      )}
    </div>
  );
};

export default ToolBar;
