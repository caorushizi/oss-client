import React, { useEffect, useRef, useState } from "react";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { ipcRenderer, remote } from "electron";
import {
  CloseCircleFilled,
  MinusCircleFilled,
  PlusCircleFilled
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
  getPlatform,
  getThemeColor,
  ThemeColor
} from "./helper/utils";
import Services from "./components/Services";
import { getBuckets, initOss } from "./helper/ipc";
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
  const onAppSwitch = async (app?: AppStore) => {
    try {
      if (app) {
        // 1、将上下文信息修改为新的 app
        const active = await initOss(app._id);
        setActiveApp(active);
        // 2、获取新的 app 中的 bucket 列表
        const buckets = await getBuckets();
        setBucketList(buckets);
      } else {
        setActiveApp(undefined);
        setBucketList([]);
      }
    } catch (err) {
      console.log("切换 app 时出错：", err.message);
    }
  };
  const toSetting = () => {
    setActivePage(Page.setting);
  };
  const toService = () => {
    setActivePage(Page.services);
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
      console.log("首页中初始化状态：", app);
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
        return <Services onAppSwitch={onAppSwitch} activeApp={activeApp} />;
      case Page.setting:
        return <Setting />;
      case Page.transferDone:
        return <TransferDone />;
      case Page.transferList:
        return <TransferList />;
      default:
        return <div>404</div>;
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
          <MinusCircleFilled
            className="icon"
            onClick={() => {
              remote.getCurrentWindow().minimize();
            }}
          />
          <PlusCircleFilled
            className="icon"
            onClick={() => {
              const window = remote.getCurrentWindow();
              if (window.isMaximized()) {
                window.unmaximize();
              } else {
                window.maximize();
              }
            }}
          />
          <CloseCircleFilled
            className="icon"
            onClick={() => {
              remote.getCurrentWindow().close();
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
}

export default App;
