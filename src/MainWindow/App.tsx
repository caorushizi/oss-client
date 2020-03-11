import React, { useEffect, useMemo, useState } from "react";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "react-redux";
import { presets, spring, TransitionMotion } from "react-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./App.scss";
import TheSidebar from "./components/TheSidebar";
import Transmitting from "./components/Transmitting";
import { RootState } from "./store";
import { Direction, Page } from "./store/app/types";
import Bucket from "./components/Bucket";
import TransferList from "./components/TransferList";
import Setting from "./components/Setting";
import { platform } from "./helper/utils";
import { Platform } from "./types";
import Apps from "./components/Services";
import {
  closeMainApp,
  getBuckets,
  maximizeMainWindow,
  minimizeMainWindow,
  switchBucket
} from "./ipc";
import { qiniuAdapter } from "./lib/adapter/qiniu";
import { Vdir } from "./lib/vdir";
import { switchPage } from "./store/app/actions";

library.add(fas);

// todo: 渐变颜色的问题
function App() {
  const dispatch = useDispatch();

  const [bucketLoading, setBucketLoading] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<Page>(Page.bucket);
  const [activeBucket, setActiveBucket] = useState<string>("");
  const [bucketList, setBucketList] = useState<string[]>([]);
  const tabChange = (page: Page, bucket?: string) => {
    setBucketLoading(true);
    setActivePage(page);
    if (bucket) setActiveBucket(bucket);
    dispatch(switchPage(page, bucket));
    setBucketLoading(false);
  };
  const handleSwitchBucket = async (bucketName: string) => {
    setBucketLoading(true);
    const bucketObj = await switchBucket(bucketName);
    const dir = Vdir.from(qiniuAdapter(bucketObj.files));
    // dispatch(setVdir(dir));
    // dispatch(switchPage(Page.bucket, bucketName));
    // dispatch(setDomains(bucketObj.domains));
    setBucketLoading(false);
  };

  useEffect(() => {
    setBucketLoading(true);

    const handleGetBuckets = async () => {
      const buckets = await getBuckets();
      // todo: 保存 cur bucket
      setBucketList(buckets);
      if (buckets.length > 0) {
        const bucketName = buckets[0];
        await handleSwitchBucket(bucketName);
      }
    };

    handleGetBuckets();

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

  const selectApp = (state: RootState) => state.app;
  const app = useSelector(selectApp);

  const bgOffset = () => {
    const bgOffsetX = Math.ceil((Math.random() - 0.5) * 800);
    const bgOffsetY = Math.ceil((Math.random() - 0.5) * 600);
    return { bgOffsetX, bgOffsetY };
  };

  const willEnter = () => ({
    transitionY: app.direction === Direction.down ? 100 : -100,
    ...bgOffset()
  });
  const willLeave = () => ({
    transitionY: spring(
      app.direction === Direction.down ? -100 : 100,
      presets.noWobble
    )
  });

  const apps = useMemo(() => <Apps />, [app.page]);
  const transmitting = useMemo(() => <Transmitting />, [app.page]);
  const transferList = useMemo(() => <TransferList />, [app.page]);
  const setting = useMemo(() => <Setting />, [app.page]);
  const bucket = useMemo(() => <Bucket />, [app.page]);

  return (
    <div className="App" style={{ background: app.appColor }}>
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
      />
      <TransitionMotion
        willEnter={willEnter}
        willLeave={willLeave}
        styles={[
          {
            key: app.page,
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
                  {Page.bucket === config.key && bucket}
                  {Page.transferList === config.key && transmitting}
                  {Page.transferDone === config.key && transferList}
                  {Page.setting === config.key && setting}
                  {Page.apps === config.key && apps}
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
