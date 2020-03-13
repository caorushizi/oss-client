import React, { ChangeEvent, useState } from "react";
import "./index.scss";
import Input from "../BaseInput";
import { OssType } from "../../../main/types";
import { AppStore } from "../../../main/store/apps";
import Button from "../BaseButton";
import set = Reflect.set;

type FormData = {
  name: string;
  ak: string;
  sk: string;
  type: OssType;
};

type PropTypes = {
  activeOss: AppStore;
  onBucketUpdate: () => void;
  onBucketDelete: () => void;
};

const ServicesUpdateItem = ({
  activeOss,
  onBucketUpdate,
  onBucketDelete
}: PropTypes) => {
  const { name, ak, sk, type } = activeOss;
  const [form, setForm] = useState<FormData>({ name, ak, sk, type });
  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.persist();
    const { value } = event.target;
    setForm({ ...form, name: value });
  };
  const onTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    event.persist();
    const { value } = event.target;
    setForm({ ...form, type: Number(value) });
  };
  const onAkChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.persist();
    const { value } = event.target;
    setForm({ ...form, ak: value });
  };
  const onSkChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.persist();
    const { value } = event.target;
    setForm({ ...form, sk: value });
  };
  return (
    <div className="main-right">
      <div className="name">{form.name || "未命名"}</div>
      <div className="config-content">
        <div className="config-item">
          <span className="title">名称</span>
          <Input
            className="input-item"
            placeholder="请输入名称"
            value={form.name}
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
            value={form.ak}
            onChange={onAkChange}
          />
        </div>
        <div className="config-item">
          <span className="title">sk</span>
          <Input
            className="input-item"
            placeholder="请输入相应服务商 sk"
            value={form.sk}
            onChange={onSkChange}
          />
        </div>
        <div>
          <Button value="更新" onClick={onBucketUpdate} />
          <Button value="删除" onClick={onBucketDelete} />
        </div>
      </div>
    </div>
  );
};
export default ServicesUpdateItem;
