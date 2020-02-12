import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Icon from "../Icon";
import Button from "../Button";
import "./index.scss";

const Transform = () => {
  return (
    <div className="transform-wrapper">
      <div className="toolbar">
        <span className="toolbar-left">正在下载 3 项/ 总共 18 项</span>
        <div className="toolbar-right">
          <Button value="全部暂停" />
          <Button value="全部取消" />
        </div>
      </div>
      <table className="transfer-table">
        <tbody>
          <tr className="transfer-table__row">
            <td className="transfer-table__row_item meta">
              <Icon filename="testtesttest.css" />
              <div>
                <div className="name">testtesttest.css</div>
                <div className="size">55MB</div>
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
        </tbody>
      </table>
    </div>
  );
};

export default Transform;
