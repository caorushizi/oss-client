import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { ipcRenderer } from "electron";
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
import "./assets/style/select.less";

function App() {
  const [themeColor, setThemeColor] = useState<ThemeColor>(getThemeColor());
  const [bgOffset, setBgOffset] = useState<string>(getBgOffset());
  const [bucketLoading, setBucketLoading] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<Page>(Page.bucket);
  const [activeBucket, setActiveBucket] = useState<string>("");
  const [bucketList, setBucketList] = useState<string[]>([]);
  const [direction, setDirection] = useState<Direction>(Direction.down);
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
    console.log("播放下载完成");
    if (audio.current) {
      await audio.current.play();
    }
  };

  useEffect(() => {
    setThemeColor(getThemeColor());
    setBgOffset(getBgOffset());
  }, [activePage]);

  // 相当于初始化流程
  useEffect(() => {
    (async () => {
      // 设置活动 oss 配置
      await initOss();
      // 获取 oss 中 bucket 列表，并选中活动项
      const buckets = await getBuckets();
      setBucketList(buckets);
      if (buckets.length > 0) {
        await tabChange(Page.bucket, buckets[0]);
      } else {
        setActivePage(Page.services);
      }
    })();

    ipcRenderer.on("to-setting", toSetting);
    ipcRenderer.on("play-finish", playAudio);

    return () => {
      ipcRenderer.removeListener("to-setting", toSetting);
      ipcRenderer.removeListener("play-finish", playAudio);
    };
  }, []);

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
          <FontAwesomeIcon
            className="icon"
            icon="minus-circle"
            onClick={minimizeMainWindow}
          />
          <FontAwesomeIcon
            className="icon"
            icon="plus-circle"
            onClick={maximizeMainWindow}
          />
          <FontAwesomeIcon
            className="icon"
            icon="times-circle"
            onClick={closeMainApp}
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
      <TransitionGroup mode="in-out">
        {Page.bucket === activePage && (
          <CSSTransition
            key={Page.bucket}
            addEndListener={(node, done) => {
              node.addEventListener("transitionend", done, false);
            }}
            classNames={direction}
          >
            <section
              className="main-wrapper"
              style={{ backgroundPosition: bgOffset }}
            >
              <Bucket
                bucketName={activeBucket}
                onLoadedBucket={onLoadedBucket}
              />
            </section>
          </CSSTransition>
        )}
        {Page.transferList === activePage && (
          <CSSTransition
            key={Page.transferList}
            addEndListener={(node, done) => {
              node.addEventListener("transitionend", done, false);
            }}
            classNames={direction}
          >
            <section
              className="main-wrapper"
              style={{ backgroundPosition: bgOffset }}
            >
              <TransferList />
            </section>
          </CSSTransition>
        )}
        {Page.transferDone === activePage && (
          <CSSTransition
            key={Page.transferDone}
            addEndListener={(node, done) => {
              node.addEventListener("transitionend", done, false);
            }}
            classNames={direction}
          >
            <section
              className="main-wrapper"
              style={{ backgroundPosition: bgOffset }}
            >
              <TransferDone />
            </section>
          </CSSTransition>
        )}
        {Page.setting === activePage && (
          <CSSTransition
            key={Page.setting}
            addEndListener={(node, done) => {
              node.addEventListener("transitionend", done, false);
            }}
            classNames={direction}
          >
            <section
              className="main-wrapper"
              style={{ backgroundPosition: bgOffset }}
            >
              <Setting />
            </section>
          </CSSTransition>
        )}
        {Page.services === activePage && (
          <CSSTransition
            key={Page.services}
            addEndListener={(node, done) => {
              node.addEventListener("transitionend", done, false);
            }}
            classNames={direction}
          >
            <section
              className="main-wrapper"
              style={{ backgroundPosition: bgOffset }}
            >
              <Services onOssActive={onOssActive} />
            </section>
          </CSSTransition>
        )}
      </TransitionGroup>
    </div>
  );
}

export default App;
