import React, { useEffect, useState } from "react";
import FileDrop from "react-file-drop";
import { ipcRenderer, remote } from "electron";

import "./index.scss";
import HeaderToolbar from "./HeaderToolbar";
import BodyTable from "./BodyTable";
import { Layout } from "../../helper/enums";
import BodyGrid from "./BodyGrid";
import Footer from "./Footer";
import HeaderButtonGroup from "./HeaderButtonGroup";
import VFolder from "../../lib/vdir/VFolder";
import { BucketObj, switchBucket } from "../../helper/ipc";
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

  const fileUpload = () => {
    const userPath = remote.app.getPath("documents");
    remote.dialog
      .showOpenDialog({
        defaultPath: userPath,
        properties: ["openFile"]
      })
      .then(result => {
        if (!result.canceled) {
          result.filePaths.forEach(filPath => {
            ipcRenderer.send(
              "req:file:upload",
              vFolder.getPathPrefix(),
              filPath
            );
          });
        }
      })
      .catch(() => {});
  };
  const backspace = () => {
    onClearItem();
    vFolder.back();
    setBucket({ ...bucket, items: vFolder.listFiles() });
  };
  const onFileDrop = (files: FileList | null) => {
    if (files) {
      const filePaths: string[] = [];
      for (let i = 0; i < files.length; i += 1) {
        filePaths.push(files[i].path);
      }
      ipcRenderer.send("drop-files", vFolder.getPathPrefix(), filePaths);
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
  const onBatchDownload = () => {
    selectedFileIdList.forEach(fileId => {
      const item = vFolder.getItem(fileId);
      ipcRenderer.send("req:file:download", item);
    });
  };
  const onBatchDelete = () => {};

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
