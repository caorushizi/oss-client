import React, { useEffect, useState } from "react";
import "./index.scss";
import { Progress } from "antd";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import Icon from "renderer/helper/iconFont";
import { fileSizeFormatter, getIconName } from "renderer/helper/utils";
import NoResult from "../Empty";
import { TransferStore } from "types/common";

type ProgressListType = {
  id: string;
  progress: number;
};

interface TransferStoreWithProgress extends TransferStore {
  progress: number;
}

enum TransferStatus {
  default,
  done,
  failed,
}

enum TaskType {
  download,
  upload,
}

const TransferList = () => {
  const [transfers, setTransfers] = useState<TransferStoreWithProgress[]>([]);

  const initState = async () => {
    const transferList = await window.electron.getTransfers({
      status: TransferStatus.default,
    });
    const transfer = transferList.map((item) => ({ ...item, progress: 0 }));
    setTransfers(transfer);
  };

  const typeFormatter = (type: TaskType) => {
    switch (type) {
      case TaskType.download:
        return <DownloadOutlined />;
      case TaskType.upload:
        return <UploadOutlined />;
      default:
        return "";
    }
  };

  const onProgress = async (e: any, list: ProgressListType[]) => {
    const transferList = await getTransfers({
      status: TransferStatus.default,
    });

    const transfer = transferList.map((item) => {
      const progress = list.find((i) => i.id === item.id);
      return {
        ...item,
        progress: progress ? progress.progress : 0,
      };
    });

    setTransfers(transfer);
  };

  const onTransferDone = () => {
    initState();
  };

  useEffect(() => {
    initState();

    window.electron.onIpcEvent("transfer-progress", onProgress);
    window.electron.onIpcEvent("transfer-finish", onTransferDone);

    return () => {
      window.electron.onIpcEvent("transfer-progress", onProgress);
      window.electron.removeIpcEvent("transfer-finish", onTransferDone);
    };
  }, []);

  return (
    <div className="transfer-list-wrapper">
      {transfers.length > 0 ? (
        <>
          <div className="toolbar">
            <span className="toolbar-left">{`总共 ${transfers.length} 项`}</span>
            <div className="toolbar-right" />
          </div>
          <section className="transfer-table__wrapper">
            <table className="transfer-table">
              <tbody>
                {transfers.map((item) => (
                  <tr className="transfer-table__row" key={item.id}>
                    <td className="transfer-table__row_item meta">
                      <Icon
                        className="icon"
                        type={getIconName(item.name)}
                        style={{ fontSize: 30 }}
                      />
                      <div className="name-wrapper">
                        <div className="name">{item.name}</div>
                        <div className="size">
                          {fileSizeFormatter(item.size)}
                        </div>
                      </div>
                    </td>
                    <td className="transfer-table__row_item progress">
                      <Progress percent={item.progress} />
                    </td>
                    <td className="transfer-table__row_item type">
                      {typeFormatter(item.type)}
                    </td>
                    <td className="transfer-table__row_item action">123</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : (
        <NoResult title="没有文件" subTitle="没有找到传输列表" />
      )}
    </div>
  );
};

export default TransferList;
