import React, { useMemo } from "react";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { useSelector } from "react-redux";
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
import { closeMainApp, maximizeMainWindow, minimizeMainWindow } from "./ipc";

library.add(fas);

// todo: 渐变颜色的问题
function App() {
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
      <TheSidebar />
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
