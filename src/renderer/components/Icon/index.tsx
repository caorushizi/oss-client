import React from "react";
import "./index.scss";
import icon from "./images/icon.png";
// import "./iconfont/iconfont";

const Icon = () => {
  return (
    <div id="icon">
      {/* <svg className="icon-test" aria-hidden="true"> */}
      {/*  {item instanceof Vdir ? <use xlinkHref="#icon-wenjian" /> : <use xlinkHref="#icon-sql" />} */}
      {/* </svg> */}
      <img src={icon} alt="icon" />
    </div>
  );
};

export default Icon;
