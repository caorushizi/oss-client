import React from "react";
import { remote, MenuItemConstructorOptions } from "electron";
import reactDom from "react-dom";
import "normalize.css/normalize.css";
import "./index.scss";
import FileDrop from "react-file-drop";
import { getRecentTransferList } from "../MainWindow/helper/ipc";

const App = () => {
  return (
    <div className="wrapper">
      <FileDrop />
    </div>
  );
};

const state = {
  dragging: false,
  pageX: 0,
  pageY: 0
};
const onMouseDown = (e: MouseEvent) => {
  state.dragging = true;
  state.pageX = e.pageX;
  state.pageY = e.pageY;
};
const onMouseMove = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (state.dragging) {
    const x = e.screenX - state.pageX;
    const y = e.screenY - state.pageY;
    remote.getCurrentWindow().setPosition(x, y);
  }
};
const onMouseUp = () => {
  state.dragging = false;
};
const onContextMenu = async () => {
  const recentList = await getRecentTransferList();
  const recentMenu: MenuItemConstructorOptions[] =
    recentList.length > 0
      ? recentList.splice(0, 5).map(i => ({
          label: i.name,
          click: () => {}
        }))
      : [{ label: "暂无最近记录", enabled: false }];
  const contextMenuTemplate: MenuItemConstructorOptions[] = [
    ...recentMenu,
    { type: "separator" },
    { label: "清除最近记录" },
    {
      label: "markdown 格式",
      type: "checkbox",
      checked: true
    }
  ];
  const menu = remote.Menu.buildFromTemplate(contextMenuTemplate);
  menu.popup();
};

window.addEventListener("mousedown", onMouseDown, false);
window.addEventListener("mousemove", onMouseMove, false);
window.addEventListener("mouseup", onMouseUp, false);
window.addEventListener("contextmenu", onContextMenu, false);

reactDom.render(<App />, document.getElementById("root"));
