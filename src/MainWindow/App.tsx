import React, { useEffect, useState } from "react";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./App.scss";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import TheSidebar from "./components/TheSidebar";
import Transmitting from "./components/Transmitting";
import { Direction, Page, Platform } from "./types";
import Bucket from "./components/Bucket";
import TransferList from "./components/TransferList";
import Setting from "./components/Setting";
import { getThemeColor, platform, ThemeColor } from "./helper/utils";
import Apps from "./components/Services";
import {
  closeMainApp,
  getBuckets,
  initOss,
  maximizeMainWindow,
  minimizeMainWindow
} from "./ipc";

library.add(fas);

// todo: 渐变颜色的问题
function App() {
  const [bucketLoading, setBucketLoading] = useState<boolean>(false);
  const [themeColor, setThemeColor] = useState<ThemeColor>(getThemeColor());
  const [activePage, setActivePage] = useState<Page>(Page.bucket);
  const [activeBucket, setActiveBucket] = useState<string>("");
  const [bucketList, setBucketList] = useState<string[]>([]);
  const [direction, setDirection] = useState<Direction>(Direction.down);
  const tabChange = async (page: Page, bucket?: string) => {
    // todo: 动画方向
    // if (page < activePage) {
    //   setDirection(Direction.down);
    // } else {
    //   setDirection(Direction.up);
    // }
    setActivePage(page);
    if (bucket) {
      setBucketLoading(true);
      setActiveBucket(bucket);
    }
  };
  const onLoadedBucket = () => {
    setBucketLoading(false);
  };
  const onOssChange = async (id: string) => {
    await initOss(id);
    // 获取 oss 中 bucket 列表，并选中活动项
    const buckets = await getBuckets();
    // todo: 保存 cur bucket
    setBucketList(buckets);
    if (buckets.length > 0) await tabChange(Page.bucket, buckets[0]);
  };

  useEffect(() => {
    setThemeColor(getThemeColor());
  }, [activePage]);

  // 相当于初始化流程
  useEffect(() => {
    (async () => {
      // 设置活动 oss 配置
      await initOss();
      // 获取 oss 中 bucket 列表，并选中活动项
      const buckets = await getBuckets();
      // todo: 保存 cur bucket
      setBucketList(buckets);
      if (buckets.length > 0) await tabChange(Page.bucket, buckets[0]);
    })();
  }, []);

  const bgOffset = () => {
    const bgOffsetX = Math.ceil((Math.random() - 0.5) * 800);
    const bgOffsetY = Math.ceil((Math.random() - 0.5) * 600);
    return `${bgOffsetX}px, ${bgOffsetY}px`;
  };

  return (
    <div
      className="App"
      style={{
        background: themeColor.appColor
      }}
    >
      <div className="drag-area" />
      {platform === Platform.windows && (
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
            timeout={10000}
            addEndListener={(node, done) => {
              node.addEventListener("transitionend", done, false);
            }}
            classNames={direction}
          >
            <section
              className="main-wrapper"
              style={{ backgroundPosition: bgOffset() }}
            >
              <Bucket bucket={activeBucket} onLoadedBucket={onLoadedBucket} />
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
              style={{ backgroundPosition: bgOffset() }}
            >
              <Transmitting />
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
              style={{ backgroundPosition: bgOffset() }}
            >
              <TransferList />
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
              style={{ backgroundPosition: bgOffset() }}
            >
              <Setting />
            </section>
          </CSSTransition>
        )}
        {Page.apps === activePage && (
          <CSSTransition
            key={Page.apps}
            addEndListener={(node, done) => {
              node.addEventListener("transitionend", done, false);
            }}
            classNames={direction}
          >
            <section
              className="main-wrapper"
              style={{ backgroundPosition: bgOffset() }}
            >
              <Apps onOssChange={onOssChange} />
            </section>
          </CSSTransition>
        )}
      </TransitionGroup>
    </div>
  );
}

export default App;
