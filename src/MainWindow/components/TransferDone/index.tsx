import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";

import "./index.scss";
import { TransferStatus, TransferStore } from "../../../main/types";
import {
  dateFormatter,
  fileSizeFormatter,
  taskTypeFormatter
} from "../../helper/utils";
import Button from "../BaseButton";
import Icon from "../FileIcon";
import { clearTransferDoneList, getTransfers } from "../../helper/ipc";

const TransferDone = () => {
  const [transfers, setTransfers] = useState<TransferStore[]>([]);

  const initTransferList = () => {
    getTransfers().then(transferList => {
      const transferDone = transferList.filter(
        i => i.status === TransferStatus.done
      );
      setTransfers(transferDone);
    });
  };
  const onClearTransferDoneList = () => {
    clearTransferDoneList().then(() => {
      initTransferList();
    });
  };

  useEffect(() => {
    initTransferList();
  }, []);
  return (
    <div className="transfer-done-wrapper">
      <div className="toolbar">
        <span className="toolbar-left">{`总共 ${transfers.length} 项`}</span>
        <div className="toolbar-right">
          <Button value="清空记录" onClick={onClearTransferDoneList} />
        </div>
      </div>
      <section className="transfer-table__wrapper">
        {transfers.length > 0 ? (
          <table className="transfer-table">
            <tbody>
              {transfers.map((item: TransferStore) => (
                <tr className="transfer-table__row" key={item.id + item.name}>
                  <td className="transfer-table__row_item meta">
                    <Icon className="icon" filename={item.name} />
                    <div className="name-wrapper">
                      <div className="name">{item.name}</div>
                      <div className="size">{fileSizeFormatter(item.size)}</div>
                    </div>
                  </td>
                  <td>{taskTypeFormatter(item.type)}</td>
                  <td>{dateFormatter(item.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-files">
            <div className="title">没有文件</div>
            <div className="sub-title">暂无传输完成的文件</div>
          </div>
        )}
      </section>
    </div>
  );
};

export default TransferDone;
