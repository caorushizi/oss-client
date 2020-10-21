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

const BodyGrid: React.FC<PropTypes> = ({
  items,
  domains,
  onFolderSelect,
  onFolderContextMenu,
  onFileSelect,
  onFileContextMenu,
  onPanelContextMenu,
  onPanelMouseDown
}) => {
  return (
    <div
      className="main-grid"
      onMouseDown={onPanelMouseDown}
      onContextMenu={onPanelContextMenu}
      role="presentation"
    >
      {items.length > 0 ? (
        items.map((item: Item) =>
          item instanceof VFolder ? (
            // vdir
            <div
              className="main-grid__cell"
              key={item.name}
              onContextMenu={e => onFolderContextMenu(e, item)}
              onDoubleClick={() => onFolderSelect(item.name)}
            >
              <div
                className="main-grid__cell-inner"
                data-row-key={item.shortId}
              >
                <IconFont
                  type={getIconName("folder")}
                  style={{ fontSize: 50 }}
                />
                <span className="name">{item.name}</span>
              </div>
            </div>
          ) : (
            // file
            <div
              className="main-grid__cell"
              key={item.name}
              onContextMenu={e => onFileContextMenu(e, item)}
              onDoubleClick={onFileSelect}
            >
              <div
                className="main-grid__cell-inner"
                data-row-key={item.shortId}
              >
                {supportedImage(item.type) && domains.length > 0 ? (
                  <Image
                    placeholder
                    className="preview-image"
                    src={`http://${domains[0]}/${item.webkitRelativePath}`}
                    alt={item.name}
                  />
                ) : (
                  <IconFont
                    type={getIconName(item.name)}
                    style={{ fontSize: 45 }}
                  />
                )}
                <span className="name">{item.name}</span>
              </div>
            </div>
          )
        )
      ) : (
        <div className="no-files">
          <div className="title">没有文件</div>
          <div className="sub-title">当前 bucket 中没有文件</div>
        </div>
      )}
    </div>
  );
};

export default BodyGrid;
