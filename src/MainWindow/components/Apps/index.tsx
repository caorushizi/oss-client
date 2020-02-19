import React from "react";
import "./index.scss";
import Table from "rc-table";
import Button from "../Button";

const Apps = () => {
  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      width: 100
    },
    {
      title: "ak",
      dataIndex: "ak",
      key: "ak",
      width: 100
    },
    {
      title: "sk",
      dataIndex: "sk",
      key: "sk",
      width: 200
    },
    {
      title: "action",
      dataIndex: "",
      key: "operations",
      render: () => <button type="button">Delete</button>
    }
  ];

  const data = [
    { name: "Jack", age: 28, address: "some where", key: "1" },
    { name: "Rose", age: 36, address: "some where", key: "2" }
  ];
  return (
    <div className="apps-wrapper">
      <div className="toolbar">
        <span className="toolbar-left">Apps</span>
        <div className="toolbar-right">
          <Button value="添加" />
        </div>
      </div>
      <Table columns={columns} data={data} />
    </div>
  );
};

export default Apps;
