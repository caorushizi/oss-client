import React from "react";
import "./index.scss";
import classNames from "classnames";

const Loading = ({ className }: { className?: string }) => {
  return (
    <div className={classNames("lds-ring", className)}>
      <div />
      <div />
      <div />
      <div />
    </div>
  );
};

export default Loading;
