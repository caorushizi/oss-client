import React, { useEffect, useState } from "react";

import "./index.scss";
import Icon from "../FileIcon";
import { TransferStatus, TransferStore } from "../../../main/types";
import { fileSizeFormatter } from "../../helper/utils";
import { getTransfers } from "../../helper/ipc";

const TransferList = () => {
  const [transfers, setTransfers] = useState<TransferStore[]>([]);
  useEffect(() => {
    (async () => {
      const transferList = await getTransfers();
      const transferDone = transferList.filter(
        i => i.status !== TransferStatus.done
      );
      setTransfers(transferDone);
    })();
  }, []);
  return (
    <div className="transfer-list-wrapper">
      <div className="toolbar">
        <span className="toolbar-left">{`总共 ${transfers.length} 项`}</span>
        <div className="toolbar-right" />
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
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-files">
            <div className="title">没有文件</div>
            <div className="sub-title">暂时没有传输中的文件</div>
          </div>
        )}
      </section>
    </div>
  );
};

export default TransferList;
