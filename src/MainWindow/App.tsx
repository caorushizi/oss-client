import React, { useEffect, useState } from "react";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { presets, spring, TransitionMotion } from "react-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./App.scss";
import TheSidebar from "./components/TheSidebar";
import Transmitting from "./components/Transmitting";
import { Direction, Page } from "./store/app/types";
import Bucket from "./components/Bucket";
import TransferList from "./components/TransferList";
import Setting from "./components/Setting";
import { getThemeColor, platform, ThemeColor } from "./helper/utils";
import { Platform } from "./types";
import Apps from "./components/Services";
import {
  closeMainApp,
  getBuckets,
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
    if (page < activePage) {
      setDirection(Direction.down);
    } else {
      setDirection(Direction.up);
    }
    if (bucket) setBucketLoading(true);
    setActivePage(page);
    if (bucket) setActiveBucket(bucket);
  };
  const onLoadedBucket = () => {
    setBucketLoading(false);
  };

  useEffect(() => {
    setThemeColor(getThemeColor());
  }, [activePage]);

  useEffect(() => {
    (async () => {
      const buckets = await getBuckets();
      // todo: 保存 cur bucket
      setBucketList(buckets);
      if (buckets.length > 0) await tabChange(Page.bucket, buckets[0]);
    })();

    // ipcRenderer.on("transfers-reply", (event, documents) => {
    //   dispatch(setTransfers(documents));
    //   dispatch(switchPage(Page.transferDone));
    // });
    //
    // ipcRenderer.on("transmitting-reply", (event, documents) => {
    //   dispatch(setTransfers(documents));
    //   dispatch(switchPage(Page.transferList));
    // });
  }, []);

  const bgOffset = () => {
    const bgOffsetX = Math.ceil((Math.random() - 0.5) * 800);
    const bgOffsetY = Math.ceil((Math.random() - 0.5) * 600);
    return { bgOffsetX, bgOffsetY };
  };

  const willEnter = () => ({
    transitionY: direction === Direction.down ? 100 : -100,
    ...bgOffset()
  });
  const willLeave = () => ({
    transitionY: spring(
      direction === Direction.down ? -100 : 100,
      presets.noWobble
    )
  });

  return (
    <div className="App" style={{ background: themeColor.appColor }}>
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
      <TransitionMotion
        willEnter={willEnter}
        willLeave={willLeave}
        styles={[
          {
            key: activePage,
            style: { transitionY: spring(0), ...bgOffset() }
          }
        ]}
      >
        {val => (
          <>
            {val.map(config => {
              return (
                <section
                  className="main-wrapper"
                  key={config.key}
                  style={{
                    transform: `translateY(${config.style.transitionY}vh)`,
                    backgroundPosition: `${config.style.bgOffsetX}px ${config.style.bgOffsetY}px`
                  }}
                >
                  {Page.bucket === config.key && (
                    <Bucket
                      bucket={activeBucket}
                      onLoadedBucket={onLoadedBucket}
                    />
                  )}
                  {Page.transferList === config.key && <Transmitting />}
                  {Page.transferDone === config.key && <TransferList />}
                  {Page.setting === config.key && <Setting />}
                  {Page.apps === config.key && <Apps />}
                </section>
              );
            })}
          </>
        )}
      </TransitionMotion>
    </div>
  );
}

export default App;
