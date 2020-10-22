import React, { useEffect, useState } from "react";

import "./index.scss";
import Icon from "../IconFont";
import { TransferStatus, TransferStore } from "../../../main/types";
import { fileSizeFormatter, getIconName } from "../../helper/utils";
import { getTransfers } from "../../helper/ipc";
import NoResult from "../NoResult";

const TransferList = () => {
  const [transfers, setTransfers] = useState<TransferStore[]>([]);
  const initState = async () => {
    const transferList = await getTransfers({
      status: TransferStatus.default
    });
    setTransfers(transferList);
  };

  useEffect(() => {
    initState().then(r => r);
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
