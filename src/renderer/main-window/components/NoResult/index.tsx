import React from "react";
import "./index.scss";

type PropTypes = {
  title: string;
  subTitle: string;
};

const NoResult: React.FC<PropTypes> = params => {
  return (
    <div className="no-result">
      <div className="title">{params.title}</div>
      <div className="sub-title">{params.subTitle}</div>
      {params.children}
    </div>
  );
};
export default NoResult;
