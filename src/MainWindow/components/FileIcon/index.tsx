import React from "react";
import { createFromIconfontCN } from "@ant-design/icons";

import { getIconName } from "../../helper/utils";

const IconFont = createFromIconfontCN({
  scriptUrl: ["https://at.alicdn.com/t/font_1257166_49oq6sv8biv.js"]
});

type PropType = { filename?: string; style?: any; className?: string };

const FileIcon = ({ filename, style, className }: PropType) => {
  return (
    <IconFont
      type={getIconName(filename)}
      className={className}
      style={style}
    />
  );
};

export default FileIcon;
