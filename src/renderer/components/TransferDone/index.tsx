import React, { useEffect, useState } from "react";

import { Button } from "antd";

import "./index.scss";
import {
  dateFormatter,
  fileSizeFormatter,
  getIconName,
  taskTypeFormatter
} from "../../lib/utils";
import Icon from "../IconFont";
import Empty from "../Empty";
import { clearTransferDoneList, getTransfers } from "../../lib/ipc";
import { TransferStore } from "types/common";
import { TransferStatus } from "types/enum";

const TransferDone = () => {
  const [transfers, setTransfers] = useState<TransferStore[]>([]);

  const initState = async () => {
    const transferList = await getTransfers({ status: TransferStatus.done });
    setTransfers(transferList.sort((a, b) => b.date - a.date));
  };
  const onClearTransferDoneList = async () => {
    await clearTransferDoneList();
    setTransfers([]);
  };

  useEffect(() => {
    initState().then(r => r);
  }, []);
  return (
    <div className="transfer-done-wrapper">
      {transfers.length > 0 ? (
        <>
          <div className="toolbar">
            <span className="toolbar-left">{`总共 ${transfers.length} 项`}</span>
            <div className="toolbar-right">
              <Button size="small" onClick={onClearTransferDoneList}>
                清空记录
              </Button>
            </div>
          </div>
          <section className="transfer-table__wrapper">
            <table className="transfer-table">
              <tbody>
                {transfers.map((item: TransferStore) => (
                  <tr className="transfer-table__row" key={item.id + item.name}>
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
                    <td>{taskTypeFormatter(item.type)}</td>
                    <td>{dateFormatter(item.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : (
        <Empty title="没有文件" subTitle="没有找到传输列表" />
      )}
    </div>
  );
};

export default TransferDone;
