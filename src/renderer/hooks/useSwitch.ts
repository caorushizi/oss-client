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
    to: "/main/bucket/1",
    direction: "",
    duration: 0,
  });
  const lastIndex = useRef(0);
  const currentIndex = pathList.findIndex((reg) => reg.test(pathname));

  // 点击侧边栏链接跳转
  const jump = (to: string) => {
    setJumpInfo({
      to,
      direction: currentIndex > lastIndex.current ? "down" : "up",
      duration: 300,
    });
  };

  useEffect(() => {
    history.replace(jumpInfo.to);
    lastIndex.current = currentIndex;
  }, [jumpInfo]);

  return [jumpInfo, jump];
};

export default useSwitch;
