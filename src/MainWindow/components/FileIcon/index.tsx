import React from "react";
import classNames from "classnames";
import { createFromIconfontCN } from "@ant-design/icons";

import { getIconName } from "../../helper/utils";

const IconFont = createFromIconfontCN({
  scriptUrl: ["https://at.alicdn.com/t/font_1257166_49oq6sv8biv.js"]
});

type PropType = { className?: string; filename?: string };

const Icon = ({ className, filename }: PropType) => {
  return (
    <IconFont
      style={{ height: 30, width: 30 }}
      className={className}
      type={getIconName(filename)}
    />
  );
};

export default Icon;
