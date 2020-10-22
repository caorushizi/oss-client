import React, { MouseEvent } from "react";
import { Image } from "antd";

import "./index.scss";
import VFolder from "../../lib/vdir/VFolder";
import { Item } from "../../lib/vdir/types";
import IconFont from "../IconFont";
import VFile from "../../lib/vdir/VFile";
import { getIconName, supportedImage } from "../../helper/utils";

type PropTypes = {
  items: Item[];
  domains: string[];
  onFolderSelect: (name: string) => void;
  onFolderContextMenu: (event: MouseEvent<HTMLElement>, item: VFolder) => void;
  onFileSelect: () => void;
  onFileContextMenu: (event: MouseEvent<HTMLElement>, item: VFile) => void;
  onPanelContextMenu: () => void;
  onPanelMouseDown: (event: MouseEvent<HTMLElement>) => void;
};

const BodyGrid: React.FC<PropTypes> = params => {
  const renderVFile = (item: VFile) => {
    return (
      <div
        className="main-grid__cell"
        key={item.name}
        onContextMenu={e => params.onFileContextMenu(e, item)}
        onDoubleClick={params.onFileSelect}
      >
        <div className="main-grid__cell-inner" data-row-key={item.shortId}>
          {supportedImage(item.type) && params.domains.length > 0 ? (
            <Image
              placeholder
              preview={false}
              className="preview-image"
              src={`http://${params.domains[0]}/${item.webkitRelativePath}`}
              alt={item.name}
            />
          ) : (
            <IconFont type={getIconName(item.name)} style={{ fontSize: 45 }} />
          )}
          <span className="name">{item.name}</span>
        </div>
      </div>
    );
  };
  const renderVFolder = (item: VFolder) => {
    return (
      <div
        className="main-grid__cell"
        key={item.name}
        onContextMenu={e => params.onFolderContextMenu(e, item)}
        onDoubleClick={() => params.onFolderSelect(item.name)}
      >
        <div className="main-grid__cell-inner" data-row-key={item.shortId}>
          <IconFont type={getIconName("folder")} style={{ fontSize: 50 }} />
          <span className="name">{item.name}</span>
        </div>
      </div>
    );
  };
  const renderItem = (item: Item) => {
    return item instanceof VFile ? renderVFile(item) : renderVFolder(item);
  };
  return (
    <div
      className="main-grid"
      onMouseDown={params.onPanelMouseDown}
      onContextMenu={params.onPanelContextMenu}
      role="presentation"
    >
      {params.items.map(renderItem)}
    </div>
  );
};

export default BodyGrid;
