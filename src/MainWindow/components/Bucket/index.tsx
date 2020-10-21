import React, { useEffect, useState, MouseEvent } from "react";
import { FileDrop } from "react-file-drop";
import { clipboard, remote } from "electron";

import "./index.scss";
import { message, Spin } from "antd";
import Selection, { SelectionEvent } from "@simonwep/selection-js";
import HeaderToolbar from "./HeaderToolbar";
import BodyTable from "./BodyTable";
import { KeyCode, Layout } from "../../helper/enums";
import BodyGrid from "./BodyGrid";
import Footer from "./Footer";
import HeaderButtonGroup from "./HeaderButtonGroup";
import VFolder from "../../lib/vdir/VFolder";
import {
  deleteFile,
  deleteFiles,
  downloadFile,
  downloadFiles,
  getConfig,
  getFileUrl,
  showConfirm,
  switchBucket,
  uploadFile,
  uploadFiles
} from "../../helper/ipc";
import { Item } from "../../lib/vdir/types";
import VFile from "../../lib/vdir/VFile";
import { BucketMeta } from "../../types";
import useKeyPress from "../../hooks/useKeyPress";

type PropTypes = {
  bucketMeta: BucketMeta;
};

// fixme: 没有文件时,则不初始化 selection
const selection = Selection.create({
  class: "selection",
  selectables: [".main-grid__cell-inner", ".ant-table-row"],
  boundaries: [".main-grid", ".main-table"],
  startThreshold: 0,
  disableTouch: true,
  singleClick: true
});

const Bucket: React.FC<PropTypes> = ({ bucketMeta }) => {
  const [vFolder, setVFolder] = useState<VFolder>(new VFolder("root"));
  const [layout, setLayout] = useState<Layout>(Layout.grid);
  const [domains, setDomains] = useState<string[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [searchedItem, setSearchedItem] = useState<Item[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedFileIdList, setSelectedFileIdList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const keypress = useKeyPress(KeyCode.Escape);

  const onSelectItem = (el: Element) => {
    const rowKey = el.getAttribute("data-row-key") || "";
    setSelectedFileIdList(f => f.concat(rowKey));
    el.classList.add("selected");
  };
  const onRemoveItem = (el: Element) => {
    const rowKey = el.getAttribute("data-row-key") || "";
    setSelectedFileIdList(f => {
      const index = f.findIndex(i => i === rowKey);
      f.splice(index, 1);
      return f.slice(0);
    });
    el.classList.remove("selected");
  };
  const onClearSelection = () => {
    setSelectedFileIdList([]);
    selection.getSelection().forEach(el => el.classList.remove("selected"));
    selection.clearSelection();
  };
  const displayBucketFiles = (meta: BucketMeta) => {
    const vf = VFolder.from(meta.files);
    setVFolder(vf);
    setItems(vf.listFiles());
    setDomains(meta.domains);
  };

  useEffect(() => {
    displayBucketFiles(bucketMeta);
  }, [bucketMeta]);

  const fileUpload = async () => {
    const userPath = remote.app.getPath("documents");
    const result = await remote.dialog.showOpenDialog({
      defaultPath: userPath,
      properties: ["openFile"]
    });
    if (result.canceled) return;
    Promise.all(
      result.filePaths.map(filepath =>
        uploadFile({ remoteDir: vFolder.getPathPrefix(), filepath })
      )
    )
      .then(() => {})
      .catch(err => {
        console.warn("上传文件时出错：", err);
      });
  };
  const backspace = () => {
    onClearSelection();
    vFolder.back();
    setItems(vFolder.listFiles());
  };
  const onFileDrop = async (files: FileList | null) => {
    try {
      if (!files) return;
      const filePaths: string[] = [];
      for (let i = 0; i < files.length; i += 1) {
        filePaths.push(files[i].path);
      }
      await uploadFiles({
        remoteDir: vFolder.getPathPrefix(),
        fileList: filePaths
      });
    } catch (e) {
      message.error(e.message);
      console.warn("拖拽文件上传时出错：", e.message);
    }
  };
  const _getFiles = (folder: VFolder) => {
    let files: VFile[] = [];
    for (const item of folder.getItems()) {
      if (item instanceof VFolder) {
        files = [...files, ..._getFiles(item)];
      } else {
        files.push(item);
      }
    }
    return files;
  };
  const onBatchDownload = () => {
    console.log(selectedFileIdList);
    selectedFileIdList.forEach(async fileId => {
      const item = vFolder.getItem(fileId);
      if (!item) return;
      let files: VFile[] = [];
      if (item instanceof VFolder) {
        files = [...files, ..._getFiles(item)];
      } else {
        files = [...files, item];
      }
      try {
        console.log(files);
        await downloadFiles(files);
        console.log("success");
      } catch (e) {
        console.log("出错：", e);
      }
    });
  };
  const onBatchDelete = async () => {
    try {
      const config = await getConfig();
      const showDialog = config.deleteShowDialog;
      if (showDialog) {
        await showConfirm({ title: "警告", message: "是否要删除该文件" });
      }

      let files: VFile[] = [];
      for (const fileId of selectedFileIdList) {
        const item = vFolder.getItem(fileId);
        if (item instanceof VFolder) {
          files = [...files, ..._getFiles(item)];
        } else if (item instanceof VFile) {
          files.push(item);
        }
      }
      await deleteFiles(files.map(i => i.webkitRelativePath));
    } catch (e) {
      console.log("删除文件时出错：", e.message);
      message.error(e.message);
    }
  };
  const onFileContextMenu = (event: MouseEvent<HTMLElement>, item: VFile) => {
    event.stopPropagation();
    const menu = remote.Menu.buildFromTemplate([
      {
        label: "全选",
        click: f => f
      },
      { type: "separator" },
      {
        label: "复制链接",
        click: async () => {
          const url = await getFileUrl(item.webkitRelativePath);
          clipboard.writeText(url);
        }
      },
      {
        label: "复制链接（markdown）",
        click: async () => {
          const url = await getFileUrl(item.webkitRelativePath);
          clipboard.writeText(`![${item.name}]("${url}")`);
        }
      },
      { type: "separator" },
      {
        label: "下载",
        click: async () => {
          if (selectedFileIdList.length > 1) {
            await onBatchDownload();
          } else {
            await downloadFile(item);
          }
        }
      },
      {
        label: "删除",
        click: async () => {
          try {
            const config = await getConfig();
            const showDialog = config.deleteShowDialog;
            if (showDialog) {
              await showConfirm({ title: "警告", message: "是否要删除该文件" });
            }
            await deleteFile(item.webkitRelativePath);
          } catch (e) {
            console.log("删除文件时出错：", e.message);
            message.error(e.message);
          }
        }
      }
    ]);
    menu.popup();
  };
  const onFolderSelect = (name: string) => {
    vFolder.changeDir(name);
    setItems(vFolder.listFiles());
  };
  const onFolderContextMenu = (e: MouseEvent<HTMLElement>, item: VFolder) => {};

  const onPanelContextMenu = () => {
    const menu = remote.Menu.buildFromTemplate([
      {
        label: "刷新",
        click: f => f
      },
      { type: "separator" },
      {
        label: "全选",
        click: async () => {}
      },
      {
        label: "取消",
        click: async () => {}
      },
      { type: "separator" },
      {
        label: "下载",
        click: async () => {}
      },
      {
        label: "删除",
        click: async () => {}
      }
    ]);
    menu.popup();
  };

  const onSearchChange = (value: string) => {
    onClearSelection();
    setSearchValue(value);
    const it = vFolder.listFiles().filter(i => i.name.indexOf(value) >= 0);
    setSearchedItem(it);
  };
  const onChangeLayout = () => {
    onClearSelection();
    setLayout(layout === Layout.grid ? Layout.table : Layout.grid);
  };
  const onRefreshBucket = async () => {
    setLoading(true);
    onClearSelection();
    const resp = await switchBucket(bucketMeta.name, true);
    displayBucketFiles({ ...resp, name: bucketMeta.name });
    setLoading(false);
  };

  const onPanelMouseDown = (event: MouseEvent<HTMLElement>) => {
    if (!event.ctrlKey && !event.metaKey && event.button !== 2) {
      onClearSelection();
    }
  };

  const selectionStart = () => {};
  const selectionMove = ({
    changed: { removed, added },
    oe
  }: SelectionEvent) => {
    if ((oe as any).button !== 2) {
      added.forEach(el => onSelectItem(el));
      removed.forEach(el => onRemoveItem(el));
    }
  };
  const selectionStop = () => {
    selection.keepSelection();
  };

  useEffect(() => {
    if (keypress) onClearSelection();
  }, [keypress]);

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

  return (
    <div className="bucket-wrapper">
      <HeaderButtonGroup
        selectedItems={selectedFileIdList}
        fileUpload={fileUpload}
        onDownload={onBatchDownload}
        onDelete={onBatchDelete}
      />
      <HeaderToolbar
        onRefreshBucket={onRefreshBucket}
        onSearchChange={onSearchChange}
        backspace={backspace}
        layout={layout}
        onChangeLayout={onChangeLayout}
        navigators={vFolder.getNav()}
      />

      <Spin spinning={loading} wrapperClassName="loading-wrapper">
        <FileDrop
          onFrameDragEnter={event => console.log("onFrameDragEnter", event)}
          onFrameDragLeave={event => console.log("onFrameDragLeave", event)}
          onFrameDrop={event => console.log("onFrameDrop", event)}
          onDragOver={event => console.log("onDragOver", event)}
          onDragLeave={event => console.log("onDragLeave", event)}
          onDrop={onFileDrop}
        >
          {bucketMeta.name ? (
            <div className="content-wrapper">
              {Layout.grid === layout ? (
                <BodyGrid
                  items={searchValue ? searchedItem : items}
                  domains={domains}
                  onFolderSelect={onFolderSelect}
                  onFolderContextMenu={onFolderContextMenu}
                  onFileSelect={() => {}}
                  onFileContextMenu={onFileContextMenu}
                  onPanelContextMenu={onPanelContextMenu}
                  onPanelMouseDown={onPanelMouseDown}
                />
              ) : (
                <BodyTable
                  items={searchValue ? searchedItem : items}
                  selectedItems={selectedFileIdList}
                  onFolderSelect={onFolderSelect}
                  onFolderContextMenu={onFolderContextMenu}
                  onFileSelect={() => {}}
                  onFileContextMenu={onFileContextMenu}
                  onPanelContextMenu={onPanelContextMenu}
                  onPanelMouseDown={onPanelMouseDown}
                />
              )}
            </div>
          ) : (
            <div className="content-wrapper">
              <div className="no-files">
                <div className="title">没有选中</div>
                <div className="sub-title">当前没有选中 bucket</div>
              </div>
            </div>
          )}
        </FileDrop>
      </Spin>
      <Footer
        totalItem={vFolder.getTotalItem()}
        selectedItem={selectedFileIdList.length}
        domains={domains}
      />
    </div>
  );
};

export default Bucket;
