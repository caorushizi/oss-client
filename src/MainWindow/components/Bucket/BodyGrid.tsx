import React from "react";
import LazyLoad from "react-lazyload";
import Selection from "@simonwep/selection-js";

import "./index.scss";
import VFolder from "../../lib/vdir/VFolder";
import { Item } from "../../lib/vdir/types";
import Icon from "../FileIcon";
import VFile from "../../lib/vdir/VFile";

type PropTypes = {
  items: Item[];
  domains: string[];
  selectedItems: Item[];
  onSelectItem: () => void;
  onFolderSelect: (name: string) => void;
  onFolderContextMenu: (item: VFolder) => void;
  onFileSelect: () => void;
  onFileContextMenu: (item: VFile) => void;
};

const selection = Selection.create({
  class: "selection",
  selectables: [".main-grid > .main-grid__cell"],
  boundaries: [".main-grid"]
});
selection.on("start", ({ inst, selected, oe }) => {
  if (!oe.ctrlKey && !oe.metaKey) {
    selected.forEach(el => {
      el.classList.remove("selected");
      inst.removeFromSelection(el);
    });
    inst.clearSelection();
  }
});
selection.on("move", ({ changed: { removed, added } }) => {
  added.forEach(el => {
    el.classList.add("selected");
  });
  removed.forEach(el => {
    el.classList.remove("selected");
  });
});
selection.on("stop", ({ inst }) => {
  inst.keepSelection();
});

const BodyGrid = ({
  items,
  domains,
  selectedItems,
  onSelectItem,
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
              {item.type.startsWith("image/") && domains.length > 0 ? (
                <LazyLoad>
                  <img
                    className="icon"
                    src={`http://${domains[0]}/${item.webkitRelativePath}`}
                    alt={item.name}
                  />
                </LazyLoad>
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
