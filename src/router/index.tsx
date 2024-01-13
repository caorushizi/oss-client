import { createRef } from "react";
import Buckets from "../pages/buckets";
import Transfer from "../pages/transfer";
import Settings from "../pages/settings";
import Apps from "../pages/apps";

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
