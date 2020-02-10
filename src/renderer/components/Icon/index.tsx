import React from "react";
import "./index.scss";
import classnames from "classnames";
import mime from "mime";

const scriptElem = document.createElement("script");
scriptElem.src = "//at.alicdn.com/t/font_1257166_49oq6sv8biv.js";
document.body.appendChild(scriptElem);

const Icon = ({ className, filename }: { className?: any; filename?: string }) => {
  return filename ? (
    // 文件
    <svg className={classnames("my-icon", className)} aria-hidden="true">
      <use xlinkHref="#icon-documents" />
    </svg>
  ) : (
    // 文件夹
    <svg className={classnames("my-icon", className)} aria-hidden="true">
      <use xlinkHref="#icon-wenjian" />
    </svg>
  );
};

export default Icon;
