import React from "react";
import classNames from "classnames";

import "./index.scss";
import { getIconName } from "../../helper/utils";

type PropType = { className?: string; filename?: string };

const Icon = ({ className, filename }: PropType) => {
  return (
    <svg className={classNames("oss-file-icon", className)} aria-hidden="true">
      <use xlinkHref={`#${getIconName(filename)}`} />
    </svg>
  );
};

export default Icon;
