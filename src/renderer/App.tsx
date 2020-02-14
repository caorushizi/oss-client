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
import Transform from "./components/Transform";
import Setting from "./components/Setting";

library.add(fas);

// todo: 渐变颜色的问题

function app() {
  const selectAppColor = (state: RootState) => state.app.appColor;
  const appColor = useSelector(selectAppColor);

  const selectPage = (state: RootState) => state.app.page;
  const page = useSelector(selectPage);

  const selectDirection = (state: RootState) => state.app.direction;
  const direction = useSelector(selectDirection);

  const willEnter = () => ({ y: direction === Direction.down ? 100 : -100 });
  const willLeave = () => ({
    y: spring(direction === Direction.down ? -100 : 100, presets.noWobble)
  });

  return (
    <div className="App" style={{ background: appColor }}>
      <div className="drag-area" />
      <Aside />
      <TransitionMotion
        willEnter={willEnter}
        willLeave={willLeave}
        styles={[{ key: String(page), style: { y: spring(0) } }]}
      >
        {val => (
          <>
            {val.map(config => {
              return (
                <section
                  className="main-wrapper"
                  key={String(config.key)}
                  style={{ transform: `translateY(${config.style.y}vh)` }}
                >
                  {String(Page.bucket) === config.key && <Bucket />}
                  {String(Page.transferList) === config.key && <Transmitting />}
                  {String(Page.transferDone) === config.key && <Transform />}
                  {String(Page.setting) === config.key && <Setting />}
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
