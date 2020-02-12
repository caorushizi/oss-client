import React from "react";
import "./index.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Breadcrumb = ({ routes }: { routes: string[] }) => {
  return (
    <div className="oss-breadcrumb">
      {routes.map((item: string, index) => (
        <div className="oss-breadcrumb-item__wrapper" key={item}>
          <div className="oss-breadcrumb-item">{item}</div>
          {index >= routes.length - 1 || (
            <div className="oss-breadcrumb-separator">
              <FontAwesomeIcon icon="greater-than" onClick={f => f} className="icon-button" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Breadcrumb;
