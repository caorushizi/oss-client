import React from "react";

import "./index.scss";
import Vdir from "../../lib/vdir/vdir";
import { Item } from "../../lib/vdir/types";
import Icon from "../BaseIcon";
import Ffile from "../../lib/vdir/ffile";

type PropTypes = {
  items: Item[];
  domains: string[];
  onFolderSelect: (name: string) => void;
  onFolderContextMenu: () => void;
  onFileSelect: () => void;
  onFileContextMenu: () => void;
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
          Vdir.isDir(item) ? (
            // vdir
            <div
              className="main-grid__cell"
              key={item.name}
              onContextMenu={() => onFolderContextMenu()}
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
              onContextMenu={onFileContextMenu}
              onDoubleClick={onFileSelect}
            >
              {(item as Ffile).type.startsWith("image/") &&
              domains.length > 0 ? (
                <img
                  className="icon"
                  src={`http://${domains[0]}/${
                    (item as Ffile).webkitRelativePath
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
