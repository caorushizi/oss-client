import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { useSelector } from "react-redux";
import { TransferStatus, TransferStore } from "../../../main/types";
import {
  dateFormatter,
  fileSizeFormatter,
  taskTypeFormatter
} from "../../helper/utils";
import { RootState } from "../../store";
import Button from "../Button";
import Icon from "../Icon";
import "./index.scss";

const TransferList = () => {
  const selectTransfers = (state: RootState) => state.app.transfers;
  const transfers = useSelector(selectTransfers);
  return (
    <div className="transfer-list-wrapper">
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
                (item: TransferStore) => item.status === TransferStatus.done
              )
              .map((item: TransferStore) => (
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
                    <FontAwesomeIcon
                      className="action-button"
                      icon="trash-alt"
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default TransferList;
