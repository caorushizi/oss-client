import React, { useEffect, useState } from "react";
import "./index.scss";
import { Button, Form, Input, Select, Space } from "antd";

import { OssType, AppStore } from "../../../main/types";
import { getBuckets, switchBucket } from "../../helper/ipc";

type PropTypes = {
  activeOss: AppStore;
  onBucketUpdate: (store: AppStore) => void;
  onBucketDelete: (store: AppStore) => void;
};

const FormUpdate = ({
  activeOss,
  onBucketUpdate,
  onBucketDelete
}: PropTypes) => {
  const [buckets, setBuckets] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  useEffect(() => {
    const initState = async () => {
      const { uploadBucket } = activeOss;
      if (uploadBucket) {
        const { domains: initialDomains } = await switchBucket(uploadBucket);
        setDomains(initialDomains);
      }
      const bucketList = await getBuckets();
      setBuckets(bucketList);
    };
    initState().then(r => r);
  }, []);

  return (
    <Form
      initialValues={activeOss}
      labelAlign="left"
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 12 }}
      name="basic"
      className="custom-form"
      onFinish={values => {
        const app = { ...activeOss, ...values };
        onBucketUpdate(app);
      }}
    >
      <Form.Item
        label="名称"
        name="name"
        rules={[{ required: true, message: "请输入名称" }]}
      >
        <Input placeholder="请输入名称" />
      </Form.Item>

      <Form.Item
        label="类型"
        name="type"
        rules={[{ required: true, message: "请选择存储厂商" }]}
      >
        <Select size="small" style={{ width: 200 }}>
          <Select.Option value={OssType.qiniu}>七牛云</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        label="AK"
        name="ak"
        rules={[{ required: true, message: "请输入 AK" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="SK"
        name="sk"
        rules={[{ required: true, message: "请输入 SK" }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        label="默认储存桶"
        name="uploadBucket"
        rules={[{ required: true, message: "请选择默认储存桶" }]}
      >
        <Select
          size="small"
          style={{ width: 200 }}
          onChange={async (val: string) => {
            const { domains: selectedDomains } = await switchBucket(val);
            setDomains(selectedDomains);
          }}
        >
          {buckets.length > 0 &&
            buckets.map(i => (
              <Select.Option key={i} value={i}>
                {i}
              </Select.Option>
            ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="上传前缀"
        name="uploadPrefix"
        rules={[{ required: true, message: "请输入 SK" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="默认域名"
        name="defaultDomain"
        rules={[{ required: true, message: "请输入 SK" }]}
      >
        <Select size="small" style={{ width: 200 }}>
          {domains.length > 0 &&
            domains.map(i => (
              <Select.Option key={i} value={i}>
                {i}
              </Select.Option>
            ))}
        </Select>
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 4, span: 8 }}>
        <Space>
          <Button type="primary" htmlType="submit" size="small">
            修改
          </Button>
          <Button onClick={() => onBucketDelete(activeOss)} size="small">
            删除
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
export default FormUpdate;
