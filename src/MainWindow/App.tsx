import React, { useEffect, useRef, useState } from "react";
import {
  CSSTransition,
  SwitchTransition,
  TransitionGroup
} from "react-transition-group";
import { ipcRenderer } from "electron";
import {
  PlusCircleFilled,
  MinusCircleFilled,
  CloseCircleFilled
} from "@ant-design/icons";
import audioSrc from "./assets/tip.mp3";

import "./App.scss";
import TheSidebar from "./components/TheSidebar";
import TransferList from "./components/TransferList";
import { Direction, Page, Platform } from "./helper/enums";
import Bucket from "./components/Bucket";
import TransferDone from "./components/TransferDone";
import Setting from "./components/Setting";
import {
  getBgOffset,
  getThemeColor,
  getPlatform,
  ThemeColor
} from "./helper/utils";
import Services from "./components/Services";
import {
  closeMainApp,
  getBuckets,
  initOss,
  maximizeMainWindow,
  minimizeMainWindow
} from "./helper/ipc";
import { AppStore } from "../main/types";

const mainWrapperWidth = document.body.clientWidth - 225;

function App() {
  const [themeColor, setThemeColor] = useState<ThemeColor>(getThemeColor());
  const [bgOffset, setBgOffset] = useState<string>(getBgOffset());
  const [bucketLoading, setBucketLoading] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<Page>(Page.bucket);
  const [activeBucket, setActiveBucket] = useState<string>("");
  const [bucketList, setBucketList] = useState<string[]>([]);
  const [direction, setDirection] = useState<Direction>(Direction.down);
  const [activeApp, setActiveApp] = useState<AppStore>();
  const audio = useRef<HTMLAudioElement>(null);
  const tabChange = async (page: Page, bucket?: string) => {
    await setDirection(page < activePage ? Direction.down : Direction.up);
    await setActivePage(page);
    if (bucket) {
      if (bucket === activeBucket) return;
      await setActiveBucket(bucket);
      await setBucketLoading(true);
    }
  };
  const onLoadedBucket = () => {
    setBucketLoading(false);
  };
  const onOssActive = async (store: AppStore) => {
    const test = await initOss(store?._id);
    const buckets = await getBuckets();
    setBucketList(buckets);
  };
  const toSetting = () => {
    setActivePage(Page.setting);
  };
  const playAudio = async () => {
    if (audio.current) {
      await audio.current.play();
    }
  };
  const initState = async () => {
    try {
      // 设置活动 oss 配置
      const app = await initOss();
      console.log(app);
      setActiveApp(app);
      // 获取 oss 中 bucket 列表，并选中活动项
      const buckets = await getBuckets();
      setBucketList(buckets);
      if (buckets.length > 0) {
        await tabChange(Page.bucket, buckets[0]);
      } else {
        setActivePage(Page.services);
      }
    } catch (err) {
      console.log("初始化云存储客户端出错：", err.message);
    }
  };

  useEffect(() => {
    setThemeColor(getThemeColor());
    setBgOffset(getBgOffset());
  }, [activePage]);

  // 相当于初始化流程
  useEffect(() => {
    initState().then(r => r);

    ipcRenderer.on("to-setting", toSetting);
    ipcRenderer.on("play-finish", playAudio);

    return () => {
      ipcRenderer.removeListener("to-setting", toSetting);
      ipcRenderer.removeListener("play-finish", playAudio);
    };
  }, []);

  const renderPage = (page: Page) => {
    switch (page) {
      case Page.bucket:
        return (
          <Bucket bucketName={activeBucket} onLoadedBucket={onLoadedBucket} />
        );
      case Page.services:
        return <Services onOssActive={onOssActive} active={activeApp} />;
      case Page.setting:
        return <Setting />;
      case Page.transferDone:
        return <TransferDone />;
      case Page.transferList:
        return <TransferList />;
      default:
        return <div>123</div>;
    }
  };

  return (
    <div
      className="App"
      style={{
        background: themeColor.appColor
      }}
    >
      <audio ref={audio} style={{ display: "none" }}>
        <source src={audioSrc} />
        <track kind="captions" />
      </audio>
      <div className="drag-area" />
      {getPlatform() === Platform.windows && (
        <div className="app-button">
          <MinusCircleFilled className="icon" onClick={minimizeMainWindow} />
          <PlusCircleFilled className="icon" onClick={maximizeMainWindow} />
          <CloseCircleFilled className="icon" onClick={closeMainApp} />
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
}

export default App;
