import React, { useEffect, useState } from "react";
import "./index.scss";
import Table from "rc-table";
import { ipcRenderer } from "electron";
import Modal from "react-modal";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../Button";
import { AppStore } from "../../../main/store/apps";

const Apps = () => {
  const [apps, setApps] = useState<AppStore[]>();
  const [modalIsOpen, setIsOpen] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<any>();

  useEffect(() => {
    ipcRenderer.send("getApps");
    ipcRenderer.on("appsRep", (event, args: AppStore[]) => {
      setApps(args);
    });
  }, []);
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
  Modal.setAppElement("#root");

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }
  const options = [
    { value: "chocolate", label: "Chocolate" },
    { value: "strawberry", label: "Strawberry" },
    { value: "vanilla", label: "Vanilla" }
  ];

  return (
    <div className="apps-wrapper">
      <div className="toolbar">
        <span className="toolbar-left">Apps</span>
        <div className="toolbar-right">
          <Button
            value="添加"
            onClick={() => {
              setIsOpen(true);
            }}
          />
        </div>
      </div>
      <Table columns={columns} data={apps} />
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Example Modal"
        className="add-app-modal"
        overlayClassName="add-app-overlay"
      >
        <section className="modal-header">
          <span>选择云存储</span>
          <FontAwesomeIcon
            className="icon"
            icon="times-circle"
            onClick={closeModal}
          />
        </section>
        <section className="modal-content__wrapper">
          <ul>
            <li>123</li>
            <li>1123</li>
            <li>123</li>
          </ul>
          <Select
            value={selectedOption}
            onChange={selected => {
              setSelectedOption(selected);
            }}
            options={options}
          />
        </section>
        <section className="modal-footer">123</section>
      </Modal>
    </div>
  );
};

export default Apps;
