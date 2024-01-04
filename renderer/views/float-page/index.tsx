import { useEffect, useState } from "react";
import "./index.scss";
import { FileDrop } from "react-file-drop";
import classNames from "classnames";
import { FlowWindowStyle, TaskType, TransferStatus } from "../../types/enum";

const App = () => {
  const [circle, setCircle] = useState<boolean>(false);

  useEffect(() => {
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("contextmenu", onContextMenu);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  }, []);

  const onSwitchShape = (
    event: Electron.IpcRendererEvent,
    t: FlowWindowStyle
  ) => {
    const currentWindow = remote.getCurrentWindow();
    if (t === FlowWindowStyle.circle) {
      setCircle(true);
      currentWindow.setContentSize(67, 67);
    } else {
      setCircle(false);
      currentWindow.setContentSize(87, 30);
    }
  };
  const onFileDrop = async (files: FileList | null) => {
    if (!files) return;
    const fileList = Array.from(files).map(file => file.path);
    await uploadFiles({ remoteDir: "拖拽上传", fileList, flag: true });
  };

  useEffect(() => {
    ipcRenderer.on("switch-shape", onSwitchShape);

    (async () => {
      const config = await getConfig();
      onSwitchShape({} as any, config.floatWindowStyle);
    })();

    return () => {
      ipcRenderer.removeListener("switch-shape", onSwitchShape);
    };
  }, []);

  return (
    <div className={classNames("wrapper", circle ? "circle" : "oval")}>
      <FileDrop onDrop={onFileDrop} />
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
  console.log(TaskType.upload);
  const recentList = await getTransfers({
    type: TaskType.upload,
    status: TransferStatus.done
  });
  const recentMenu: Electron.MenuItemConstructorOptions[] =
    recentList.length > 0
      ? recentList.splice(0, 5).map(i => ({
        label: i.name.replace(
          /^(.{5}).*(.{6})$/,
          (_: any, $1: any, $2: any) => `${$1}……${$2}`
        ),
        click: () => {
          // empty
        }
      }))
      : [{ label: "暂无最近记录", enabled: false }];
  const contextMenuTemplate: Electron.MenuItemConstructorOptions[] = [
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

export default App;
