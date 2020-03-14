import React from "react";

import "./index.scss";
import VFolder from "../../lib/vdir/VFolder";
import { Item } from "../../lib/vdir/types";
import Icon from "../BaseIcon";
import VFile from "../../lib/vdir/VFile";

type PropTypes = {
  items: Item[];
  domains: string[];
  onFolderSelect: (name: string) => void;
  onFolderContextMenu: (item: VFolder) => void;
  onFileSelect: () => void;
  onFileContextMenu: (item: VFile) => void;
};

const BodyGrid = ({
  items,
  domains,
  onFolderSelect,
  onFolderContextMenu,
  onFileSelect,
  onFileContextMenu
}: PropTypes) => {
  return (
    <div className="main-grid">
      {items.length > 0 ? (
        items.map((item: Item) =>
          item instanceof VFolder ? (
            // vdir
            <div
              className="main-grid__cell"
              key={item.name}
              onContextMenu={() => onFolderContextMenu(item)}
              onDoubleClick={() => onFolderSelect(item.name)}
            >
              <Icon className="icon" />
              <span>{item.name}</span>
            </div>
          ) : (
            // file
            <div
              className="main-grid__cell"
              key={item.name}
              onContextMenu={() => onFileContextMenu(item)}
              onDoubleClick={onFileSelect}
            >
              {(item as VFile).type.startsWith("image/") &&
              domains.length > 0 ? (
                <img
                  className="icon"
                  src={`http://${domains[0]}/${
                    (item as VFile).webkitRelativePath
                  }`}
                  alt={item.name}
                />
              ) : (
                <Icon className="icon" filename={item.name} />
              )}
              <span>{item.name}</span>
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
