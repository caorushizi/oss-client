import { useHistory } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

// 主页路由顺序列表
const pathList = [
  /bucket/,
  /transfer-list/,
  /transfer-done/,
  /settings/,
  /apps/,
];

export interface JumpInfo {
  to: string;
  direction: string;
  duration: number;
}

const useSwitch = (pathname: string): [JumpInfo, (path: string) => void] => {
  const history = useHistory();
  // 页面跳转时的信息
  const [jumpInfo, setJumpInfo] = useState({
    to: "/main/apps",
    direction: "",
    duration: 0,
  });
  const lastIndex = useRef(0);
  const currentIndex = useRef(0);

  // 点击侧边栏链接跳转
  const jump = (to: string) => {
    if (pathname === to) {
      return;
    }
    currentIndex.current = pathList.findIndex((reg) => reg.test(to));
    setJumpInfo({
      to,
      direction: currentIndex.current <= lastIndex.current ? "down" : "up",
      duration: 300,
    });
  };

  useEffect(() => {
    history.replace(jumpInfo.to);
    lastIndex.current = currentIndex.current;
  }, [jumpInfo]);

  return [jumpInfo, jump];
};

export default useSwitch;
