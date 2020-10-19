import React from "react";
import { Form, Button, Input, Select } from "antd";
import "./index.scss";
import shortId from "shortid";
import { OssType } from "../../../main/types";

type PropTypes = {
  onBucketAdd: (values: AddForm) => void;
};

const FormAdd = ({ onBucketAdd }: PropTypes) => {
  return (
    <Form
      initialValues={{
        name: shortId(),
        ak: "",
        sk: "",
        type: OssType.qiniu
      }}
      labelAlign="left"
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 12 }}
      className="custom-form"
      hideRequiredMark
      onFinish={values => {
        onBucketAdd({
          name: values.name,
          sk: values.sk,
          ak: values.ak,
          type: values.type
        });
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
        <Select size="small">
          <Select.Option value={OssType.qiniu}>七牛云</Select.Option>
          <Select.Option value={OssType.ali}>阿里云</Select.Option>
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

      <Form.Item wrapperCol={{ offset: 4, span: 8 }}>
        <Button size="small" type="primary" htmlType="submit">
          确定
        </Button>
      </Form.Item>
    </Form>
  );
};
export default FormAdd;
