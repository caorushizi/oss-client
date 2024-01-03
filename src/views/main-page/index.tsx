import React, { useEffect, useState } from "react";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import {
  CloseCircleFilled,
  MinusCircleFilled,
  PlusCircleFilled
} from "@ant-design/icons";
import { message } from "antd";
import audioSrc from "../../assets/audios/tip.mp3";

import "./index.scss";
import TheSidebar from "../../components/TheSidebar";
import TransferList from "../../components/TransferList";
import { Direction, Page, Platform } from "../../lib/enums";
import Bucket from "../../components/Bucket";
import TransferDone from "../../components/TransferDone";
import Setting from "../../components/Setting";
import {
  getBgOffset,
  getPlatform,
  getThemeColor,
  ThemeColor
} from "../../lib/utils";
import Services from "../../components/Services";
import { AppStore } from "../../types/common";
import { BucketMeta } from "../../types/index";
import { useRequest } from "ahooks";
import { getBuckets } from "../../api";

const audio = new Audio(audioSrc);

const Index: React.FC = () => {
  const { runAsync } = useRequest(getBuckets, {
    manual: true
  });
  const getWidth = () => document.body.clientWidth - 225;
  const [themeColor, setThemeColor] = useState<ThemeColor>(getThemeColor());
  const [bgOffset, setBgOffset] = useState<string>(getBgOffset());
  const [bucketLoading, setBucketLoading] = useState<boolean>(false);
  const [bucketMeta, setBucketMeta] = useState<BucketMeta>(new BucketMeta());
  const [activePage, setActivePage] = useState<Page>(Page.bucket);
  const [activeBucket, setActiveBucket] = useState<string>("");
  const [bucketList, setBucketList] = useState<string[]>([]);
  const [direction, setDirection] = useState<Direction>(Direction.down);
  const [activeApp, setActiveApp] = useState<AppStore>();
  const [mainWrapperWidth, setMainWrapperWidth] = useState<number>(getWidth());

  const throttle = () => {
    let running = false;
    return () => {
      if (running) return;
      running = true;
      requestAnimationFrame(() => {
        setMainWrapperWidth(getWidth());
        running = false;
      });
    };
  };
  const throttleFn = throttle();
  /**
   * 应用侧边栏变换触发
   * @param page 页面名称
   * @param bucket bucket名称，如果不是 bucket page ，则没有 bucket 参数
   */
  const tabChange = async (page: Page, bucket: string) => {
    try {
      await setDirection(page < activePage ? Direction.down : Direction.up);
      if (bucket && bucket !== activeBucket) {
        setBucketLoading(true);
        setActiveBucket(bucket);
        setBucketMeta({ ...resp, name: bucket });
        setBucketLoading(false);
      }
      setActivePage(page);
    } catch (e) {
      message.error(e.message);
    } finally {
      setBucketLoading(false);
    }
  };
  const onAppSwitch = async (app?: AppStore) => {
    try {
      if (app) {
        // 1、将上下文信息修改为新的 app
        // 2、获取新的 app 中的 bucket 列表
        const buckets = await runAsync();
        setBucketList(buckets);
      } else {
        setActiveApp(undefined);
        setBucketList([]);
      }
    } catch (err) {
      message.error(`切换 app 时出错：${err.message}`);
    }
  };
  const toSetting = () => {
    setActivePage(Page.setting);
  };
  const toService = () => {
    setActivePage(Page.services);
  };
  const playAudio = async () => {
    if (audio) {
      await audio.play();
    }
  };
  const initState = async () => {
    try {
      // 设置活动 oss 配置
      // const app = await initOss();
      // setActiveApp(app);
      // 获取 oss 中 bucket 列表，并选中活动项
      const buckets = await runAsync();
      console.log("buckets", buckets);
      setBucketList(buckets);
      if (buckets.length > 0) {
        await tabChange(Page.bucket, buckets[0]);
      } else {
        setActivePage(Page.services);
      }
    } catch (err) {
      toService();
    }
  };

  useEffect(() => {
    setThemeColor(getThemeColor());
    setBgOffset(getBgOffset());
  }, [activePage]);

  // 相当于初始化流程
  useEffect(() => {
    initState().then(r => r);

    // fixme： resize 变化是窗口尺寸变化
    window.onresize = () => {
      setMainWrapperWidth(document.body.clientWidth - 225);
    };

    // ipcRenderer.on("to-setting", toSetting);
    // ipcRenderer.on("transfer-finish", playAudio);
    window.addEventListener("resize", throttleFn);

    return () => {
      // ipcRenderer.removeListener("to-setting", toSetting);
      // ipcRenderer.removeListener("transfer-finish", playAudio);
      window.removeEventListener("resize", throttleFn);
    };
  }, []);

  const renderPage = (page: Page) => {
    switch (page) {
      case Page.bucket:
        return <Bucket bucketMeta={bucketMeta} />;
      case Page.services:
        return <Services onAppSwitch={onAppSwitch} activeApp={activeApp} />;
      case Page.setting:
        return <Setting />;
      case Page.transferDone:
        return <TransferDone />;
      case Page.transferList:
        return <TransferList />;
      default:
        return null;
    }
  };

  return (
    <div
      className="App"
      style={{
        background: themeColor.appColor
      }}
    >
      <div className="drag-area" />
      {getPlatform() === Platform.windows && (
        <div className="app-button">
          <MinusCircleFilled
            className="icon"
            onClick={() => {
            }}
          />
          <PlusCircleFilled
            className="icon"
            onClick={() => {
            }}
          />
          <CloseCircleFilled
            className="icon"
            onClick={() => {
            }}
          />
        </div>
      )}
      <TheSidebar
        bucketLoading={bucketLoading}
        bucketList={bucketList}
        activeBucket={activeBucket}
        activePage={activePage}
        tabChange={tabChange}
        color={themeColor.asideColor}
      />
      <SwitchTransition>
        <CSSTransition
          key={activePage}
          addEndListener={(node, done) => {
            node.addEventListener("transitionend", done, false);
          }}
          classNames={direction}
        >
          <section
            className="main-wrapper"
            style={{
              backgroundPosition: bgOffset,
              width: mainWrapperWidth,
              maxWidth: mainWrapperWidth
            }}
          >
            {renderPage(activePage)}
          </section>
        </CSSTransition>
      </SwitchTransition>
    </div>
  );
};

export default Index;
