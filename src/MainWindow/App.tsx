import React from "react";
import "./App.scss";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { useSelector } from "react-redux";
import { presets, spring, TransitionMotion } from "react-motion";
import Aside from "./components/Aside";
import Transmitting from "./components/Transmitting";
import { RootState } from "./store";
import { Direction, Page } from "./store/app/types";
import Bucket from "./components/Bucket";
import TransferList from "./components/TransferList";
import Setting from "./components/Setting";
import { platform } from "./helper/utils";
import { Platform } from "./types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Apps from "./components/Apps";
import { closeMainApp, maximizeMainWindow, minimizeMainWindow } from "./ipc";

library.add(fas);

// todo: 渐变颜色的问题

function app() {
  const selectAppColor = (state: RootState) => state.app.appColor;
  const appColor = useSelector(selectAppColor);

  const selectPage = (state: RootState) => state.app.page;
  const page = useSelector(selectPage);

  const selectDirection = (state: RootState) => state.app.direction;
  const direction = useSelector(selectDirection);

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
    <div className="App" style={{ background: appColor }}>
      <div className="drag-area" />
      {platform === Platform.windows && (
        <div className="app-button">
          <FontAwesomeIcon
            className="icon"
            icon="minus-circle"
            onClick={closeMainApp}
          />
          <FontAwesomeIcon
            className="icon"
            icon="plus-circle"
            onClick={minimizeMainWindow}
          />
          <FontAwesomeIcon
            className="icon"
            icon="times-circle"
            onClick={maximizeMainWindow}
          />
        </div>
      )}
      <Aside />
      <TransitionMotion
        willEnter={willEnter}
        willLeave={willLeave}
        styles={[
          {
            key: String(page),
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
                  key={String(config.key)}
                  style={{
                    transform: `translateY(${config.style.transitionY}vh)`,
                    backgroundPosition: `${config.style.bgOffsetX}px ${config.style.bgOffsetY}px`
                  }}
                >
                  {String(Page.bucket) === config.key && <Bucket />}
                  {String(Page.transferList) === config.key && <Transmitting />}
                  {String(Page.transferDone) === config.key && <TransferList />}
                  {String(Page.setting) === config.key && <Setting />}
                  {String(Page.apps) === config.key && <Apps />}
                </section>
              );
            })}
          </>
        )}
      </TransitionMotion>
    </div>
  );
}

export default app;
