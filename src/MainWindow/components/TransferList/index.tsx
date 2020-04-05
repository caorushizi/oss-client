import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";

import "./index.scss";
import Icon from "../FileIcon";
import Button from "../BaseButton";
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
        <span className="toolbar-left">
          {`正在下载 ${123} 项 / 总共 ${transfers.length} 项`}
        </span>
        <div className="toolbar-right">
          <Button value="全部暂停" />
          <Button value="全部取消" />
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
                  <td className="transfer-table__row_item">
                    <FontAwesomeIcon className="icon" icon="pause" />
                  </td>
                  <td className="transfer-table__row_item">
                    <FontAwesomeIcon className="icon" icon="trash-alt" />
                  </td>
                  <td className="transfer-table__row_item">
                    <FontAwesomeIcon className="icon" icon="folder" />
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
