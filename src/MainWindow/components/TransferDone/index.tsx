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
import Icon from "../BaseIcon";
import { getTransfers } from "../../ipc";

const TransferDone = () => {
  const [transfers, setTransfers] = useState<TransferStore[]>([]);
  useEffect(() => {
    (async () => {
      const transferList = await getTransfers();
      const transferDone = transferList.filter(
        i => i.status === TransferStatus.done
      );
      setTransfers(transferDone);
    })();
  }, []);
  return (
    <div className="transfer-done-wrapper">
      <div className="toolbar">
        <span className="toolbar-left">{`总共 ${transfers.length} 项`}</span>
        <div className="toolbar-right">
          <Button value="清空记录" />
        </div>
      </div>
      <section className="transfer-table__wrapper">
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
                <td className="transfer-table__row_item">
                  <FontAwesomeIcon className="action-button" icon="folder" />
                </td>
                <td className="transfer-table__row_item">
                  <FontAwesomeIcon className="action-button" icon="trash-alt" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default TransferDone;
