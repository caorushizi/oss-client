import App from "../layout/App";
import { createBrowserRouter } from "react-router-dom";
import "antd/dist/reset.css";
import Buckets from "../pages/buckets";
import Transfer from "../pages/transfer";
import Settings from "../pages/settings";
import Apps from "../pages/apps";
import { createRef } from "react";

export const routes = [
  {
    path: "/:bucket",
    element: <Buckets />,
    nodeRef: createRef<HTMLDivElement>(),
  },
  {
    path: "/transfer-list",
    element: <Transfer />,
    nodeRef: createRef<HTMLDivElement>(),
  },
  {
    path: "/transfer-done",
    element: <Transfer />,
    nodeRef: createRef<HTMLDivElement>(),
  },
  {
    path: "/settings",
    element: <Settings />,
    nodeRef: createRef<HTMLDivElement>(),
  },
  {
    path: "/apps",
    element: <Apps />,
    nodeRef: createRef<HTMLDivElement>(),
  },
];

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: routes.map((route) => ({
      index: route.path === "/",
      path: route.path === "/" ? undefined : route.path,
      element: route.element,
    })),
  },
]);

export default router;
