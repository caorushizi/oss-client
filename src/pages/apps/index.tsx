import { Col, Row, Space, message } from "antd";
import Header from "components/Header";
import { Button } from "antd";
import { useRef, useState } from "react";
import {
  ProForm,
  ProFormText,
  ProFormInstance,
} from "@ant-design/pro-components";
import { addApp } from "../../api";

type PageStatus = "add" | "list";

const waitTime = (time: number = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

interface AddFormProps {
  name: string;
  type: string;
  ak: string;
  sk: string;
}

const Apps = () => {
  const formRef = useRef<ProFormInstance>();
  const [status, setStatus] = useState<PageStatus>("add");

  const renderAdd = () => {
    return (
      <div>
        <Button onClick={() => setStatus("list")}>返回</Button>

        <ProForm<AddFormProps>
          formRef={formRef}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 14 }}
          layout="horizontal"
          submitter={{
            render: (_, doms) => {
              return (
                <Row>
                  <Col span={14} offset={4}>
                    <Space>{doms}</Space>
                  </Col>
                </Row>
              );
            },
          }}
          onFinish={async (values) => {
            await formRef.current?.validateFields();

            const app = await addApp(values);
            console.log(app);

            await waitTime(2000);
            console.log(values);
            message.success("提交成功");
          }}
        >
          <ProFormText
            name="name"
            label="名称"
            rules={[{ required: true }]}
            placeholder="请输入名称"
          />
          <ProFormText
            name="type"
            rules={[{ required: true }]}
            label="类型"
            placeholder="请输入名称"
          />
          <ProFormText name="ak" label="AK" placeholder="请输入名称" />
          <ProFormText name="sk" label="SK" placeholder="请输入名称" />
        </ProForm>
      </div>
    );
  };

  const renderList = () => {
    return (
      <Row>
        <Col span={8}>
          <div>
            <Button onClick={() => setStatus("add")}>添加</Button>
          </div>
          <div>
            <div>123</div>
            <div>123</div>
            <div>123</div>
          </div>
        </Col>
        <Col span={16}>col-8</Col>
      </Row>
    );
  };

  return (
    <div>
      <Header />
      {status === "add" ? renderAdd() : renderList()}
    </div>
  );
};

export default Apps;
