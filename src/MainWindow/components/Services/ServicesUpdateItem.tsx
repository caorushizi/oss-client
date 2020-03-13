import React, { ChangeEvent } from "react";
import "./index.scss";
import Input from "../BaseInput";
import { OssType } from "../../../main/types";
import { AppStore } from "../../../main/store/apps";

type PropTypes = {
  activeOss: AppStore;
};

const ServicesUpdateItem = ({ activeOss }: PropTypes) => {
  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.persist();
    const { value } = event.target;
    console.log(value);
  };
  const onTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    event.persist();
    const { value } = event.target;
    console.log(value);
  };
  const onAkChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.persist();
    const { value } = event.target;
    console.log(value);
  };
  const onSkChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.persist();
    const { value } = event.target;
    console.log(value);
  };
  return (
    <div className="main-right">
      <div className="name">{activeOss?.name || "未命名"}</div>
      <div className="config-content">
        <div className="config-item">
          <span className="title">名称</span>
          <Input
            className="input-item"
            placeholder="请输入名称"
            value={activeOss?.name}
            onChange={onNameChange}
          />
        </div>
        <div className="config-item">
          <span className="title">类型</span>
          <select
            className="select-item"
            name="bucket"
            id="bucket"
            onChange={onTypeChange}
          >
            <option value={OssType.qiniu}>七牛云</option>
            <option value={OssType.ali}>阿里云</option>
            <option value={OssType.tencent}>腾讯云</option>
          </select>
        </div>
        <div className="config-item">
          <span className="title">ak</span>
          <Input
            className="input-item"
            placeholder="请输入相应服务商 ak"
            value={activeOss?.ak}
            onChange={onAkChange}
          />
        </div>
        <div className="config-item">
          <span className="title">sk</span>
          <Input
            className="input-item"
            placeholder="请输入相应服务商 sk"
            value={activeOss?.sk}
            onChange={onSkChange}
          />
        </div>
        <div>更新</div>
      </div>
    </div>
  );
};
export default ServicesUpdateItem;
