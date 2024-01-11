import { Layout } from "antd";
import useStyle from "./style";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import { useLocation, useNavigate, useOutlet } from "react-router-dom";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { routes } from "../../router";
import { useEffect, useMemo, useState } from "react";
import {
  AppstoreFilled,
  CheckSquareFilled,
  FolderFilled,
  RetweetOutlined,
  SettingFilled,
} from "@ant-design/icons";
import { useGetAppsQuery, useGetBucketsQuery } from "../../api";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { setCurrApp } from "../../store/appSlice";

const { Sider, Content } = Layout;

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

const styles = [
  {
    content: "linear-gradient(#8B5C68, #37394E)",
    sider: "linear-gradient(#8B5C68, #484B58)",
  },
  {
    content: "linear-gradient(#875D56, #3A3B4E)",
    sider: "linear-gradient(#875D56, #484B58)",
  },
  {
    content: "linear-gradient(#546F67, #333B4E)",
    sider: "linear-gradient(#546F67, #484B58)",
  },
  {
    content: "linear-gradient(#7D5A86, #39394E)",
    sider: "linear-gradient(#7D5A86, #484B58)",
  },
  {
    content: "linear-gradient(#80865A, #39394E)",
    sider: "linear-gradient(#80865A, #484B58)",
  },
  {
    content: "linear-gradient(#8B5C68, #37394E)",
    sider: "linear-gradient(#8B5C68, #484B58)",
  },
];

export const getThemeColor = () =>
  styles[Math.floor(Math.random() * styles.length)];

export const getBgOffset: () => string = () => {
  const bgOffsetX = Math.ceil((Math.random() - 0.5) * 800);
  const bgOffsetY = Math.ceil((Math.random() - 0.5) * 600);
  return `${bgOffsetX}px, ${bgOffsetY}px`;
};

const bucketItems = (items: string[]) => {
  const buckets = items.map((item) => ({
    key: `/${item}`,
    label: item,
    icon: <FolderFilled />,
  }));
  return getItem("存储空间", "Buckets", null, buckets, "group");
};

const transferItems = getItem(
  "传输列表",
  "transfer",
  null,
  [
    getItem("传输列表", "/transfer-list", <RetweetOutlined />),
    getItem("传输完成", "/transfer-done", <CheckSquareFilled />),
  ],
  "group",
);

const settingItems = getItem(
  "设置",
  "stg",
  null,
  [
    getItem("设置", "/settings", <SettingFilled />),
    getItem("apps", "/apps", <AppstoreFilled />),
  ],
  "group",
);

const getNavs = (data: string[]) => {
  return {
    navs: [bucketItems(data), transferItems, settingItems],
    navsIndex: [
      ...data.map((i) => `/${i}`),
      "/transfer-list",
      "/transfer-done",
      "/settings",
      "/apps",
    ],
  };
};

function findIndex(key: React.Key, keys: React.Key[]) {
  return keys.findIndex((i) => i === key);
}

interface Direction {
  direction: "up" | "down";
  key: React.Key;
}

function findPath(path: string) {
  return routes.find((r) => r.path === path);
}

function App() {
  const [color, setColor] = useState(getThemeColor());
  const [bgOffset, setBgOffset] = useState(getBgOffset());
  const { styles } = useStyle();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const currentOutlet = useOutlet();
  const { nodeRef } = findPath(pathname) ?? {};
  const currApp = useAppSelector((state) => state.app.currApp);
  const { data } = useGetBucketsQuery(currApp);
  const { data: apps } = useGetAppsQuery();
  const dispatch = useAppDispatch();

  console.log("currAppcurrAppcurrApp", currApp, data);
  const { navs, navsIndex } = useMemo(() => {
    return getNavs(data ?? []);
  }, [data]);
  const [direction, setDirection] = useState<Direction>({
    direction: "down",
    key: navsIndex[0],
  });

  useEffect(() => {
    console.log("apps", apps);
    console.log("currApp", currApp);
    if (!currApp && apps) {
      dispatch(setCurrApp(apps[0].name));
    }
  }, [currApp, apps]);

  return (
    <Layout className={styles.container}>
      <Sider
        width="225"
        className={styles.sider}
        style={{
          backgroundImage: color.sider,
        }}
      >
        <div className={styles.siderAppName} data-tauri-drag-region>
          OSS Client
        </div>
        <Menu
          defaultSelectedKeys={[pathname]}
          mode="inline"
          items={navs}
          onSelect={(e) => {
            setDirection((prev) => {
              const prevKey = findIndex(prev.key, navsIndex);
              const currKey = findIndex(e.key, navsIndex);
              const direction = currKey < prevKey ? "up" : "down";
              return {
                direction,
                key: e.key,
              };
            });

            setTimeout(() => {
              navigate(e.key);
              setColor(getThemeColor());
              setBgOffset(getBgOffset());
            }, 100);
          }}
        />
      </Sider>
      <Layout>
        <Content
          className={styles.contentWrapper}
          style={{
            backgroundImage: color.content,
          }}
        >
          <SwitchTransition mode="out-in">
            <CSSTransition
              key={pathname}
              nodeRef={nodeRef}
              timeout={300}
              classNames={direction.direction}
              unmountOnExit
            >
              <div
                style={{
                  backgroundPosition: bgOffset,
                }}
                ref={nodeRef}
                className={styles.contentInner}
              >
                {currentOutlet}
              </div>
            </CSSTransition>
          </SwitchTransition>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
