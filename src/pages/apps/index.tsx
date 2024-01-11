import { App, Col, Row, Space, Flex } from "antd";
import Header from "components/Header";
import { Button, Modal } from "antd";
import { useEffect, useState } from "react";
import { ProForm, ProFormText } from "@ant-design/pro-components";
import {
  AppForm,
  useAddAppMutation,
  useDeleteAppMutation,
  useGetAppsQuery,
} from "../../api";
import useStyle from "./style";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { setCurrApp } from "../../store/appSlice";
import clsx from "clsx";
import { CheckCircleOutlined } from "@ant-design/icons";

type PageStatus = "add" | "list";
type formStatus = "view" | "edit";

const Apps = () => {
  const { message } = App.useApp();
  const [status, setStatus] = useState<PageStatus>("list");
  const [formStatus, setFormStatus] = useState<formStatus>("view");
  const { styles } = useStyle();
  const dispatch = useAppDispatch();
  const [form] = ProForm.useForm<AppForm>();
  const { data } = useGetAppsQuery();
  const [addApp] = useAddAppMutation();
  const [deleteApp] = useDeleteAppMutation();
  const currApp = useAppSelector((state) => state.app.currApp);
  const [currFormApp, setCurrFormApp] = useState<string>("");
  console.log("1231223213", currApp);

  useEffect(() => {
    if (!currFormApp && currApp) {
      const selectedApp = data?.find((app) => app.name === currApp);
      if (selectedApp) {
        setCurrFormApp(currApp);
        form.setFieldsValue(selectedApp);
      }
    }
  }, [currFormApp, currApp]);

  const renderAdd = () => {
    return (
      <div>
        <Button onClick={() => setStatus("list")}>返回</Button>

        <ProForm<AppForm>
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
            try {
              const app = await addApp(values);
              console.log(app);

              message.success("提交成功");
            } catch (error: any) {
              console.log(error.message);
              message.error(error.message);
            }
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

  console.log("currApp", currApp);

  const renderList = () => {
    return (
      <Row>
        <Col span={8}>
          <div>
            <Button onClick={() => setStatus("add")}>添加</Button>
          </div>
          <div>
            {data?.map((app: any) => {
              return (
                <Flex
                  justify="space-between"
                  align="center"
                  className={clsx(styles.appItem, {
                    active: currFormApp === app.name,
                  })}
                  key={app.name}
                  onClick={() => {
                    setFormStatus("view");
                    setCurrFormApp(app.name);
                    form.setFieldsValue(app);
                  }}
                >
                  {app.name}
                  {currApp === app.name ? (
                    <CheckCircleOutlined />
                  ) : (
                    <Button
                      type="text"
                      onClick={() => {
                        dispatch(setCurrApp(app.name));
                      }}
                    >
                      设为默认
                    </Button>
                  )}
                </Flex>
              );
            })}
          </div>
        </Col>
        <Col span={16}>
          <ProForm<AppForm>
            form={form}
            readonly={formStatus === "view"}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 14 }}
            grid={true}
            layout="horizontal"
            onFinish={async (values) => {
              console.log(values);
            }}
            submitter={{
              render: ({ submit }) => {
                return (
                  <Row>
                    <Col span={14} offset={4}>
                      <Space>
                        {formStatus === "view" ? (
                          <>
                            <Button onClick={() => setFormStatus("edit")}>
                              编辑
                            </Button>
                            <Button
                              danger
                              onClick={() => {
                                Modal.confirm({
                                  maskClosable: true,
                                  title: "删除",
                                  content: "确认删除吗？",
                                  onOk: () => {
                                    deleteApp(form.getFieldValue("name"));
                                  },
                                });
                              }}
                            >
                              删除
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button onClick={() => setFormStatus("view")}>
                              取消
                            </Button>
                            <Button
                              type="primary"
                              onClick={() => {
                                submit();
                              }}
                            >
                              提交
                            </Button>
                          </>
                        )}
                      </Space>
                    </Col>
                  </Row>
                );
              },
            }}
          >
            <ProForm.Group title="基础信息">
              <ProFormText
                name="name"
                label="名称"
                rules={[{ required: true }]}
                placeholder="请输入名称"
              />
              <ProFormText
                name="type"
                label="云服务厂商"
                rules={[{ required: true }]}
                placeholder="请输入名称"
              />
              <ProFormText
                name="ak"
                label="AK"
                rules={[{ required: true }]}
                placeholder="请输入名称"
              />
              <ProFormText
                name="sk"
                label="SK"
                rules={[{ required: true }]}
                placeholder="请输入名称"
              />
            </ProForm.Group>
            <ProForm.Group title="软件配置">
              <ProFormText
                name="uploadPath"
                label="上传路径"
                rules={[{ required: true }]}
                placeholder="请输入名称"
              />
              <ProFormText
                name="uploadPrefix"
                label="上传前缀"
                rules={[{ required: true }]}
                placeholder="请输入名称"
              />
              <ProFormText
                name="defaultDomain"
                label="默认域名"
                rules={[{ required: true }]}
                placeholder="请输入名称"
              />
            </ProForm.Group>
          </ProForm>
        </Col>
      </Row>
    );
  };

  return (
    <div className={styles.container}>
      <Header />
      {status === "add" ? renderAdd() : renderList()}
    </div>
  );
};

export default Apps;
