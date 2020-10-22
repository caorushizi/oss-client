import React, { MouseEvent, useEffect, useState } from "react";
import { FileDrop } from "react-file-drop";
import { clipboard, remote } from "electron";

import "./index.scss";
import { message, Spin } from "antd";
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
import useSelection from "./hooks/useSelection";
import NoResult from "../NoResult";

type PropTypes = {
  bucketMeta: BucketMeta;
};

const Bucket: React.FC<PropTypes> = ({ bucketMeta }) => {
  const [vFolder, setVFolder] = useState<VFolder>(new VFolder("root"));
  const [layout, setLayout] = useState<Layout>(Layout.grid);
  const [domains, setDomains] = useState<string[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [searchedItem, setSearchedItem] = useState<Item[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const keypress = useKeyPress(KeyCode.Escape);
  const selection = useSelection(items);

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
    try {
      const userPath = remote.app.getPath("documents");
      const result = await remote.dialog.showOpenDialog({
        defaultPath: userPath,
        properties: ["openFile"]
      });
      if (result.canceled) return;
      const pathPrefix = vFolder.getPathPrefix();
      for (const filepath of result.filePaths) {
        await uploadFile({ remoteDir: pathPrefix, filepath });
      }
    } catch (e) {
      console.warn("上传文件时出错：", e);
    }
  };
  const backspace = () => {
    selection.clear();
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
    selection.fileIds.forEach(async fileId => {
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

  const onRefreshBucket = async () => {
    setLoading(true);
    selection.clear();
    const resp = await switchBucket(bucketMeta.name, true);
    displayBucketFiles({ ...resp, name: bucketMeta.name });
    setLoading(false);
  };
  const onBatchDelete = async () => {
    try {
      const config = await getConfig();
      const showDialog = config.deleteShowDialog;
      if (showDialog) {
        await showConfirm({ title: "警告", message: "是否要删除该文件" });
      }

      let files: VFile[] = [];
      for (const fileId of selection.fileIds) {
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
        click: async () => {
          selection.selectAll();
        }
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
          if (selection.fileIds.length > 1) {
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
  const onFolderContextMenu = (
    event: MouseEvent<HTMLElement>,
    item: VFolder
  ) => {
    event.stopPropagation();
    const menu = remote.Menu.buildFromTemplate([
      {
        label: "全选",
        click: () => {
          selection.selectAll();
        }
      },
      { type: "separator" },
      {
        label: "下载",
        click: async () => {
          await onBatchDownload();
        }
      },
      {
        label: "删除",
        click: async () => {
          try {
            const config = await getConfig();
            const showDialog = config.deleteShowDialog;
            if (showDialog) {
              await showConfirm({
                title: "警告",
                message: "是否要删除该文件夹"
              });
            }
            await onBatchDelete();
          } catch (e) {
            console.log("删除文件时出错：", e.message);
            message.error(e.message);
          }
        }
      }
    ]);
    menu.popup();
  };

  const onPanelContextMenu = () => {
    const menu = remote.Menu.buildFromTemplate([
      {
        label: "刷新",
        click: async () => {
          await onRefreshBucket();
        }
      },
      { type: "separator" },
      {
        label: "全选",
        click: async () => {
          selection.selectAll();
        }
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
    selection.clear();
    setSearchValue(value);
    const it = vFolder.listFiles().filter(i => i.name.indexOf(value) >= 0);
    setSearchedItem(it);
  };
  const onChangeLayout = () => {
    selection.clear();
    setLayout(layout === Layout.grid ? Layout.table : Layout.grid);
  };

  const onPanelMouseDown = (event: MouseEvent<HTMLElement>) => {
    if (!event.ctrlKey && !event.metaKey && event.button !== 2) {
      selection.clear();
    }
  };

  useEffect(() => {
    if (keypress) selection.clear();
  }, [keypress]);

  const renderMainPanel = () => {
    if (!bucketMeta.name) {
      return <NoResult title="没有 Bucket" subTitle="当前没有选中的存储桶" />;
    }
    if (items.length <= 0) {
      return <NoResult title="没有文件" subTitle="当前 bucket 中没有文件" />;
    }
    return Layout.grid === layout ? (
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
        selectedItems={selection.fileIds}
        onFolderSelect={onFolderSelect}
        onFolderContextMenu={onFolderContextMenu}
        onFileSelect={() => {}}
        onFileContextMenu={onFileContextMenu}
        onPanelContextMenu={onPanelContextMenu}
        onPanelMouseDown={onPanelMouseDown}
      />
    );
  };

  return (
    <div className="bucket-wrapper">
      <HeaderButtonGroup
        selectedItems={selection.fileIds}
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
          <div className="content-wrapper">{renderMainPanel()}</div>
        </FileDrop>
      </Spin>
      <Footer
        totalItem={vFolder.getTotalItem()}
        selectedItem={selection.fileIds.length}
        domains={domains}
      />
    </div>
  );
};

export default Bucket;
