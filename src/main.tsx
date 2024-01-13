import { StrictMode } from "react";
import { ConfigProvider } from "antd";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { routes } from "./router";
import Layout from "./layout/App";
import zhCN from "antd/locale/zh_CN";
import "antd/dist/reset.css";
import "./main.scss";
import { App } from "antd";
import { store } from "./store";
import { Provider } from "react-redux";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: routes.map((route) => ({
      index: route.path === "/",
      path: route.path === "/" ? undefined : route.path,
      element: route.element,
    })),
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Provider store={store}>
      <ConfigProvider
        locale={zhCN}
        componentSize="small"
        theme={{
          token: {
            fontSize: 12,
            colorText: "rgba(255, 255, 255, 0.75)",
            colorBgContainer: "rgba(225, 255, 255, 0.2)",
          },
          components: {
            Menu: {
              itemHeight: 26,
              itemBorderRadius: 10,
              itemSelectedBg: "rgba(0, 0, 0, 0.15)",
              itemSelectedColor: "#fff",
              activeBarBorderWidth: 0,
              itemActiveBg: "rgba(0, 0, 0, 0.15)",
              groupTitleColor: "rgba(255, 255, 255, 0.75)",
              itemBg: "transparent",
              groupTitleFontSize: 14,
            },
            Button: {
              defaultBg: "rgba(255, 255, 255, 0.15)",
            },
            Input: {},
            Message: {
              contentBg: "rgba(0, 0, 0, 0.15)",
            },
          },
        }}
      >
        <App>
          <RouterProvider router={router} />
        </App>
      </ConfigProvider>
    </Provider>
  </StrictMode>,
);
