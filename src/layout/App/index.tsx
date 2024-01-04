import { Layout } from "antd";
import useStyle from "./style";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import { Link, useLocation, useOutlet } from "react-router-dom";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { routes } from "../../router";
import { useRef, useState } from "react";

const { Header, Footer, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: "group",
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  };
}

const items: MenuProps["items"] = [
  getItem(
    "Buckets",
    "Buckets",
    null,
    [
      getItem(<Link to={"/bucket1"}>Buckets1</Link>, "1"),
      getItem(<Link to={"/bucket2"}>Buckets2</Link>, "2"),
    ],
    "group",
  ),
  getItem(
    "传输列表",
    "transfer",
    null,
    [
      getItem(<Link to={"/transfer-list"}>传输列表</Link>, "3"),
      getItem(<Link to={"/transfer-done"}>传输完成</Link>, "4"),
    ],
    "group",
  ),
  getItem(
    "设置",
    "stg",
    null,
    [
      getItem(<Link to={"/settings"}>设置</Link>, "5"),
      getItem(<Link to={"/apps"}>apps</Link>, "6"),
    ],
    "group",
  ),
];

function App() {
  const [direction, setDirection] = useState<"up" | "down">("down");
  const prevMenu = useRef<MenuItem>();
  const { styles } = useStyle();
  const { pathname } = useLocation();
  const currentOutlet = useOutlet();
  const { nodeRef } = routes.find((r) => r.path === pathname) ?? {};

  return (
    <Layout className={styles.container}>
      <Sider width="225">
        <Menu
          className={styles.sider}
          defaultSelectedKeys={["1"]}
          defaultOpenKeys={["sub1"]}
          mode="inline"
          items={items}
          onSelect={(e) => {
            console.log(e);
            const currKey = Number(e.key);
            const prevKey = Number(prevMenu.current?.key || 0);
            console.log(currKey, prevKey);
            setDirection(() => {
              return currKey < prevKey ? "up" : "down";
            });
            prevMenu.current = e;
            console.log(prevMenu.current);
          }}
        />
      </Sider>
      <Layout>
        <Header>Header</Header>
        <Content style={{ background: "red" }}>
          <SwitchTransition>
            <CSSTransition
              key={pathname}
              nodeRef={nodeRef}
              timeout={300}
              classNames={direction}
              unmountOnExit
            >
              {() => (
                <div ref={nodeRef} className={direction}>
                  {currentOutlet}
                  {direction}
                </div>
              )}
            </CSSTransition>
          </SwitchTransition>
        </Content>
        <Footer>Footer</Footer>
      </Layout>
    </Layout>
  );
}

export default App;
