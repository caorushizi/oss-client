import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

import "./index.scss";
import Icon from "../BaseIcon";
import Button from "../BaseButton";
import { TransferStatus, TransferStore } from "../../../main/types";
import { fileSizeFormatter } from "../../helper/utils";

const Transmitting = () => {
  const transfers: TransferStore[] = [];
  return (
    <div className="transmitting-wrapper">
      <div className="toolbar">
        <span className="toolbar-left">正在下载 3 项/ 总共 18 项</span>
        <div className="toolbar-right">
          <Button value="全部暂停" />
          <Button value="全部取消" />
        </div>
      </div>
      <section className="transfer-table__wrapper">
        <table className="transfer-table">
          <tbody>
            {transfers
              .filter(
                (item: TransferStore) => item.status !== TransferStatus.done
              )
              .map((item: TransferStore) => (
                <tr className="transfer-table__row" key={item.id + item.name}>
                  <td className="transfer-table__row_item meta">
                    <Icon filename={item.name} />
                    <div>
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
      </section>
    </div>
  );
};

export default Transmitting;
