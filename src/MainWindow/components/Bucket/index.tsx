import React, { useEffect, useState } from "react";
import FileDrop from "react-file-drop";
import { remote } from "electron";

import "./index.scss";
import { message } from "antd";
import HeaderToolbar from "./HeaderToolbar";
import BodyTable from "./BodyTable";
import { Layout } from "../../helper/enums";
import BodyGrid from "./BodyGrid";
import Footer from "./Footer";
import HeaderButtonGroup from "./HeaderButtonGroup";
import VFolder from "../../lib/vdir/VFolder";
import {
  BucketObj,
  deleteFile,
  deleteFiles,
  downloadFile,
  downloadFiles,
  getConfig,
  showConfirm,
  switchBucket,
  uploadFile,
  uploadFiles
} from "../../helper/ipc";
import { qiniuAdapter } from "../../lib/adapter/qiniu";
import { Item } from "../../lib/vdir/types";
import VFile from "../../lib/vdir/VFile";
import { fileContextMenu } from "../../helper/contextMenu";

type PropTypes = {
  bucketName: string;
  onLoadedBucket: () => void;
};

interface IBucket {
  domains: string[];
  items: Item[];
}

const Bucket = ({ bucketName, onLoadedBucket }: PropTypes) => {
  const [vFolder, setVFolder] = useState<VFolder>(new VFolder("root"));
  const [layout, setLayout] = useState<Layout>(Layout.grid);
  const [bucket, setBucket] = useState<IBucket>({ domains: [], items: [] });
  const [searchedItem, setSearchedItem] = useState<Item[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedFileIdList, setSelectedFileIdList] = useState<string[]>([]);

  const onClearItem = () => setSelectedFileIdList([]);
  const displayBucketFiles = (bucketObj: BucketObj) => {
    const adaptedFiles = qiniuAdapter(bucketObj.files);
    const vf = VFolder.from(adaptedFiles);
    onLoadedBucket();
    setVFolder(vf);
    setBucket({ items: vf.listFiles(), domains: bucketObj.domains });
  };

  useEffect(() => {
    if (!bucketName) return;
    switchBucket(bucketName).then(bucketObj => displayBucketFiles(bucketObj));
  }, [bucketName]);

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
    onClearItem();
    vFolder.back();
    setBucket({ ...bucket, items: vFolder.listFiles() });
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
  const onFileContextMenu = (item: VFile) => {
    fileContextMenu(item, bucket.domains[0]);
  };
  const onFolderSelect = (name: string) => {
    vFolder.changeDir(name);
    setBucket({ ...bucket, items: vFolder.listFiles() });
  };
  const onFolderContextMenu = (item: VFolder) => {};
  const onSearchChange = (value: string) => {
    onClearItem();
    setSearchValue(value);
    const it = vFolder.listFiles().filter(i => i.name.indexOf(value) >= 0);
    setSearchedItem(it);
  };
  const onChangeLayout = () => {
    onClearItem();
    setLayout(layout === Layout.grid ? Layout.table : Layout.grid);
  };
  const onRefreshBucket = () => {
    onClearItem();
    switchBucket(bucketName).then(bucketObj => displayBucketFiles(bucketObj));
  };
  const onSelectItem = (fileId: string) => {
    setSelectedFileIdList(f => f.concat(fileId));
  };
  const onRemoveItem = (fileId: string) => {
    setSelectedFileIdList(f => {
      const index = f.findIndex(i => i === fileId);
      f.splice(index, 1);
      return f.slice(0);
    });
  };
  const _getFiles = (folder: VFolder) => {
    let items: VFile[] = [];
    for (const item of folder.getItems()) {
      if (item instanceof VFolder) {
        items = [...items, ..._getFiles(item)];
      } else {
        items.push(item);
      }
    }
    return items;
  };
  const onBatchDownload = () => {
    selectedFileIdList.forEach(async fileId => {
      const item = vFolder.getItem(fileId);
      if (!item) return;
      let items: VFile[] = [];
      if (item instanceof VFolder) {
        items = [...items, ..._getFiles(item)];
      }
      try {
        await downloadFiles(items);
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

      let items: VFile[] = [];
      for (const fileId of selectedFileIdList) {
        const item = vFolder.getItem(fileId);
        if (item instanceof VFolder) {
          items = [...items, ..._getFiles(item)];
        } else if (item instanceof VFile) {
          items.push(item);
        }
      }
      await deleteFiles(items.map(i => i.webkitRelativePath));
    } catch (e) {
      console.log("删除文件时出错：", e.message);
      message.error(e.message);
    }
  };

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
      {bucketName ? (
        <div className="content-wrapper">
          <FileDrop onDrop={onFileDrop} />
          {Layout.grid === layout ? (
            <BodyGrid
              items={searchValue ? searchedItem : bucket.items}
              domains={bucket.domains}
              selectedItems={selectedFileIdList}
              onSelectItem={onSelectItem}
              onRemoveItem={onRemoveItem}
              onClearItem={onClearItem}
              onFolderSelect={onFolderSelect}
              onFolderContextMenu={onFolderContextMenu}
              onFileSelect={() => {}}
              onFileContextMenu={onFileContextMenu}
            />
          ) : (
            <BodyTable
              items={searchValue ? searchedItem : bucket.items}
              selectedItems={selectedFileIdList}
              onSelectItem={onSelectItem}
              onRemoveItem={onRemoveItem}
              onFolderSelect={onFolderSelect}
              onFolderContextMenu={onFolderContextMenu}
              onFileSelect={() => {}}
              onFileContextMenu={onFileContextMenu}
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
      <Footer
        totalItem={vFolder.getTotalItem()}
        selectedItem={selectedFileIdList.length}
        domains={bucket.domains}
      />
    </div>
  );
};

export default Bucket;
