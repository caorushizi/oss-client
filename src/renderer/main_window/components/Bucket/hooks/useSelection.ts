import { useState, useEffect } from "react";
import Selection, { SelectionEvent } from "@simonwep/selection-js";
import { Item } from "../../../lib/vdir/types";

const selection = Selection.create({
  class: "selection",
  selectables: [".main-grid__cell-inner", ".ant-table-row"],
  boundaries: [".main-grid", ".main-table"],
  startThreshold: 10,
  disableTouch: true,
  singleClick: true
});

const useSelection = (items: Item[]) => {
  const [fileIds, setFileIds] = useState<string[]>([]);

  const clear = () => {
    setFileIds([]);
    selection.getSelection().forEach(el => el.classList.remove("selected"));
    selection.clearSelection();
  };
  const selectAll = () => {
    setFileIds(items.map(v => v.shortId));
    selection.select([".ant-table-row", ".main-grid__cell-inner"]);
    selection.keepSelection();
    selection.getSelection().map(el => el.classList.add("selected"));
  };

  const selectionStart = () => {};
  const selectionMove = ({
    changed: { removed, added },
    oe
  }: SelectionEvent) => {
    if ((oe as any).button !== 2) {
      added.forEach(el => {
        const rowKey = el.getAttribute("data-row-key") || "";
        setFileIds(f => f.concat(rowKey));
        el.classList.add("selected");
      });
      removed.forEach(el => {
        const rowKey = el.getAttribute("data-row-key") || "";
        setFileIds(f => {
          const index = f.findIndex(i => i === rowKey);
          f.splice(index, 1);
          return f.slice(0);
        });
        el.classList.remove("selected");
      });
    }
  };
  const selectionStop = () => {
    selection.keepSelection();
  };

  useEffect(() => {
    selection.on("start", selectionStart);
    selection.on("move", selectionMove);
    selection.on("stop", selectionStop);

    return () => {
      selection.off("start", selectionStart);
      selection.off("move", selectionMove);
      selection.off("stop", selectionStop);
    };
  }, []);
  return { fileIds, selectAll, clear };
};

export default useSelection;
