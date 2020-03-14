import React from "react";
import "./index.scss";

const Breadcrumb = ({ routes }: { routes: string[] }) => {
  return (
    <div className="oss-breadcrumb">
      {routes.map((item: string, index) => (
        <div className="oss-breadcrumb-item__wrapper" key={item}>
          <div className="oss-breadcrumb-item">{item}</div>
          {index >= routes.length - 1 || (
            <div className="oss-breadcrumb-separator">/</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Breadcrumb;
