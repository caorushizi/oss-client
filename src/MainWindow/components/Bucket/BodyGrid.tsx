import React, { useEffect } from "react";
import LazyLoad from "react-lazyload";
import Selection, { SelectionEvent } from "@simonwep/selection-js";

import "./index.scss";
import VFolder from "../../lib/vdir/VFolder";
import { Item } from "../../lib/vdir/types";
import IconFont from "../IconFont";
import VFile from "../../lib/vdir/VFile";
import useKeyPress from "../../hooks/useKeyPress";
import { KeyCode } from "../../helper/enums";
import { getIconName } from "../../helper/utils";

type PropTypes = {
  items: Item[];
  domains: string[];
  selectedItems: string[];
  onSelectItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onClearItem: () => void;
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

const BodyGrid = ({
  items,
  domains,
  selectedItems,
  onSelectItem,
  onRemoveItem,
  onClearItem,
  onFolderSelect,
  onFolderContextMenu,
  onFileSelect,
  onFileContextMenu
}: PropTypes) => {
  const keypress = useKeyPress(KeyCode.Escape);
  const selectionStart = ({ inst, selected, oe }: SelectionEvent) => {
    if (!oe.ctrlKey && !oe.metaKey) {
      selected.forEach(el => {
        onRemoveItem(el.id);
        el.classList.remove("selected");
        inst.removeFromSelection(el);
      });
      onClearItem();
      inst.clearSelection();
    }
  };
  const selectionMove = ({ changed: { removed, added } }: SelectionEvent) => {
    // 添加向选中区域添加元素
    added.forEach(el => {
      const fileId = el.id;
      onSelectItem(fileId);
      el.classList.add("selected");
    });
    // 从选中区域移除元素
    removed.forEach(el => {
      const fileId = el.id;
      onRemoveItem(fileId);
      el.classList.remove("selected");
    });
  };
  const selectionStop = ({ inst }: SelectionEvent) => inst.keepSelection();
  const clearArea = () => {
    onClearItem();
    selection.getSelection().forEach(el => el.classList.remove("selected"));
  };
  useEffect(() => {
    if (keypress) clearArea();
  }, [keypress]);

  useEffect(() => {
    selection.on("start", selectionStart);
    selection.on("move", selectionMove);
    selection.on("stop", selectionStop);
  }, []);

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
              id={item.shortId}
            >
              <IconFont type={getIconName("folder")} style={{ fontSize: 50 }} />
              <span>{item.name}</span>
            </div>
          ) : (
            // file
            <div
              className="main-grid__cell"
              key={item.name}
              onContextMenu={() => onFileContextMenu(item)}
              onDoubleClick={onFileSelect}
              id={item.shortId}
            >
              {item.type.startsWith("image/") && domains.length > 0 ? (
                <LazyLoad>
                  <img
                    className="preview-image"
                    src={`http://${domains[0]}/${item.webkitRelativePath}`}
                    alt={item.name}
                  />
                </LazyLoad>
              ) : (
                <IconFont
                  type={getIconName(item.name)}
                  style={{ fontSize: 45 }}
                />
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
