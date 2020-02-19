import React from "react";
import "./index.scss";
import Table from "rc-table";
import Button from "../Button";

const Apps = () => {
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 100
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
      width: 100
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      width: 200
    },
    {
      title: "Operations",
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
