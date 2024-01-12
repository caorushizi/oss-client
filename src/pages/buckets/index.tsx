import { Breadcrumb, Button, Flex, Input, Space } from "antd";
import Header from "../../components/Header";
import useStyle from "./style";
import { LeftOutlined, ReloadOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useGetFilesQuery } from "../../api";
import { useAppSelector } from "../../hooks";

const Buckets = () => {
  const { styles } = useStyle();
  const { bucket } = useParams();
  const currApp = useAppSelector((state) => state.app.currApp);
  const { data } = useGetFilesQuery({ bucket: bucket || "", appName: currApp });

  useEffect(() => {
    console.log(data);
  }, []);

  const renderActionBar = () => {
    return (
      <div className={styles.actionBar}>
        <Space>
          <Button>上传文件</Button>
          <Button>下载</Button>
          <Button>上传</Button>
        </Space>
      </div>
    );
  };
  const renderToolbar = () => {
    return (
      <Flex className={styles.toolBar} justify="space-between">
        <Space>
          <Button type="text">
            <LeftOutlined />
          </Button>
          <Button type="text">
            <ReloadOutlined />
          </Button>
          <Breadcrumb
            items={[
              {
                title: "首页",
              },
              {
                title: "测试",
              },
            ]}
          />
        </Space>
        <Space>
          <Input />
          <Button>列表</Button>
        </Space>
      </Flex>
    );
  };
  const renderContent = () => {
    return <div className={styles.content}>content</div>;
  };
  const renderFooter = () => {
    return <div className={styles.footer}>footer</div>;
  };
  return (
    <div className={styles.container}>
      <Header />
      {renderActionBar()}
      {renderToolbar()}
      {renderContent()}
      {renderFooter()}
    </div>
  );
};

export default Buckets;
