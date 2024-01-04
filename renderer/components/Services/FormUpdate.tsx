import { useEffect, useState } from "react";
import "./index.scss";
import { Button, Form, Input, message, Select, Space, Spin } from "antd";
import { AppStore } from "../../types/common";
import { OssType } from "../../types/enum";

type PropTypes = {
  activeApp: AppStore;
  onBucketUpdate: (store: any) => void;
  onBucketCancel: () => void;
  onFormChange: (changedValues: any, values: any) => void;
};

const FormUpdate = ({
  activeApp,
  onBucketUpdate,
  onBucketCancel,
  onFormChange
}: PropTypes) => {
  const [buckets, setBuckets] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 初始化组件状态
  const initState = async () => {
    try {
      setLoading(true);
      // 获取当前 app 中的所有 bucket
      const bucketList = await getBuckets();
      setBuckets(bucketList);
      // 如果“默认上传 bucket”已经存在，则用来获取域名列表
      const { uploadBucket } = activeApp;
      if (uploadBucket) {
        const { domains: initialDomains } = await switchBucket(uploadBucket);
        setDomains(initialDomains);
      }
    } catch (e) {
      message.error(e.message);
      onBucketCancel();
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    initState().then(r => r);
  }, []);

  return (
    <Spin spinning={loading} size="large">
      <Form
        initialValues={activeApp}
        labelAlign="left"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 12 }}
        hideRequiredMark
        onValuesChange={onFormChange}
        className="main-right_form_wrapper"
        onFinish={onBucketUpdate}
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
            {/* <Select.Option value={OssType.ali}>阿里云</Select.Option> */}
            {/* <Select.Option value={OssType.tencent}>腾讯云</Select.Option> */}
          </Select>
        </Form.Item>
        <Form.Item
          label="AK"
          name="ak"
          rules={[{ required: true, message: "请输入 AK" }]}
        >
          <Input placeholder="请输入 AK" />
        </Form.Item>
        <Form.Item
          label="SK"
          name="sk"
          rules={[{ required: true, message: "请输入 SK" }]}
        >
          <Input.Password placeholder="请输入 SK" />
        </Form.Item>
        <Form.Item
          label="默认储存桶"
          name="uploadBucket"
          rules={[{ required: false }]}
        >
          <Select
            size="small"
            notFoundContent="当前没有 buckets！"
            onChange={async (val: string) => {
              try {
                setLoading(true);
                const { domains: selectedDomains } = await switchBucket(val);
                setDomains(selectedDomains);
              } catch (e) {
                message.error(e.message);
              } finally {
                setLoading(false);
              }
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
          rules={[{ required: false }]}
        >
          <Input placeholder="请输入上传前缀" />
        </Form.Item>

        <Form.Item
          label="默认域名"
          name="defaultDomain"
          rules={[{ required: false }]}
        >
          <Select size="small" notFoundContent="当前 bucket 没有绑定域名">
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
              确定
            </Button>
            <Button onClick={() => onBucketCancel()} size="small">
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Spin>
  );
};
export default FormUpdate;
