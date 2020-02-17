import React from "react";
import "./index.scss";
import classNames from "classnames";
import mime from "mime";
import mapType from "./mapType";

const scriptElem = document.createElement("script");
scriptElem.src = "//at.alicdn.com/t/font_1257166_49oq6sv8biv.js";
document.body.appendChild(scriptElem);

function getIconName(filename?: string): string {
  let iconName: string;
  if (filename) {
    const mimeType = mime.getType(filename);
    if (mimeType) iconName = mapType[mimeType];
    else iconName = "icon-documents";
  } else {
    iconName = "icon-wenjian";
  }
  return iconName;
}

const Icon = ({
  className,
  filename
}: {
  className?: any;
  filename?: string;
}) => {
  return (
    <svg className={classNames("my-icon", className)} aria-hidden="true">
      <use xlinkHref={`#${getIconName(filename)}`} />
    </svg>
  );
};

export default Icon;
