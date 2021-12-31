import React, { MouseEvent, useEffect, useState } from "react";
import { FileDrop } from "react-file-drop";
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
  deleteFiles,
  downloadFiles,
  getConfig,
  getFileUrl,
  refreshBucket,
  showConfirm,
  uploadFiles
} from "../../helper/ipc";
import { Item } from "../../lib/vdir/types";
import VFile from "../../lib/vdir/VFile";
import useKeyPress from "../../hooks/useKeyPress";
import useSelection from "./hooks/useSelection";
import NoResult from "../NoResult";
import store from "../../../../main/helper/store";
import {
  clipboard,
  ipcRenderer,
  remote
} from "../../../common/script/electron";
import { BucketMeta } from "types/index";

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

  const backspace = () => {
    selection.clear();
    vFolder.back();
    setItems(vFolder.listFiles());
  };
  const _getFiles = (itemArr: Item[]) => {
    let files: VFile[] = [];
    itemArr.forEach(item => {
      if (item instanceof VFile) {
        files.push(item);
      } else {
        files = [...files, ..._getFiles([...item.getItems()])];
      }
    });
    return files;
  };
  const onRefreshBucket = async () => {
    setLoading(true);
    selection.clear();
    const resp = await refreshBucket(true);
    displayBucketFiles({ ...resp, name: bucketMeta.name });
    setLoading(false);
  };
  const getOperationFiles = (opItem?: Item) => {
    // 开始获取选中文件数量
    let files: VFile[] = [];
    if (selection.fileIds.length > 0) {
      // 如果选中区域有文件的话，那么下载选中区域的文件
      const itemsArr: Item[] = [];
      selection.fileIds.forEach(fileId => {
        const item = vFolder.getItem(fileId);
        if (item) itemsArr.push(item);
      });
      files = _getFiles(itemsArr);
    }

    if (files.length <= 0 && opItem) {
      // 如果选中区域没有文件，那么直接下载当前上下文中的区域
      files = _getFiles([opItem]);
    }

    return files;
  };
  const handleUpload = async (paths: string[]) => {
    try {
      await uploadFiles({
        remoteDir: vFolder.getPathPrefix(),
        fileList: paths
      });
    } catch (e) {
      message.error(e.message);
    }
  };
  const handleDownload = async (item?: Item) => {
    try {
      const files = getOperationFiles(item);
      await downloadFiles({
        remoteDir: vFolder.getPathPrefix(),
        fileList: files
      });
    } catch (e) {
      message.error(`下载文件出错：${e.message}`);
    }
  };
  const handleDelete = async (item?: Item) => {
    try {
      const config = await getConfig();
      const showDialog = config.deleteShowDialog;
      if (showDialog) {
        await showConfirm({
          title: "警告",
          message: "是否要删除该文件夹"
        });
      }
      const files = getOperationFiles(item);
      await deleteFiles(files.map(i => i.webkitRelativePath));
      await onRefreshBucket();
    } catch (e) {
      message.error(`删除文件出错：${e.message}`);
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
          clipboard.writeText(`![${item.name}](${url})`);
        }
      },
      { type: "separator" },
      {
        label: "下载",
        click: () => handleDownload(item)
      },
      {
        label: "删除",
        click: () => handleDelete(item)
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
        click: () => handleDownload(item)
      },
      {
        label: "删除",
        click: () => handleDelete(item)
      }
    ]);
    menu.popup();
  };

  const onPanelContextMenu = () => {
    const menu = remote.Menu.buildFromTemplate([
      {
        label: "刷新",
        click: () => onRefreshBucket()
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
        click: async () => {
          selection.clear();
        }
      },
      { type: "separator" },
      {
        label: "下载",
        click: () => handleDownload()
      },
      {
        label: "删除",
        click: () => handleDelete()
      }
    ]);
    menu.popup();
  };

  const onSearchChange = (value: string) => {
    selection.clear();
    setSearchValue(value);
    const it = vFolder.listFiles().filter(i => i.name.includes(value));
    setSearchedItem(it);
  };
  const onChangeLayout = async () => {
    selection.clear();
    const nextLayout = layout === Layout.grid ? Layout.table : Layout.grid;
    setLayout(nextLayout);
    await store.setItem<Layout>("layout", nextLayout);
  };

  const onPanelMouseDown = (event: MouseEvent<HTMLElement>) => {
    if (!event.ctrlKey && !event.metaKey && event.button !== 2) {
      selection.clear();
    }
  };

  const onUploadFinish = () => {
    onRefreshBucket();
  };

  useEffect(() => {
    if (keypress) selection.clear();
  }, [keypress]);

  useEffect(() => {
    store.getItem<Layout>("layout").then(value => {
      if (value) {
        setLayout(value);
      }
    });
  }, []);

  useEffect(() => {
    ipcRenderer.on("upload-finish", onUploadFinish);

    return () => {
      ipcRenderer.removeListener("upload-finish", onUploadFinish);
    };
  }, [bucketMeta]);

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
        onFileSelect={() => {
          console.log();
        }}
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
        onFileSelect={() => {
          console.log();
        }}
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
        fileUpload={async () => {
          const userPath = remote.app.getPath("documents");
          const result = await remote.dialog.showOpenDialog({
            defaultPath: userPath,
            properties: ["openFile"]
          });
          if (result.canceled) return;
          await handleUpload(result.filePaths);
        }}
        onDownload={() => handleDownload()}
        onDelete={() => handleDelete()}
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
          onDrop={async files => {
            if (files) {
              const filePaths: string[] = [];
              for (let i = 0; i < files.length; i += 1) {
                filePaths.push(files[i].path);
              }
              await handleUpload(filePaths);
            }
          }}
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
