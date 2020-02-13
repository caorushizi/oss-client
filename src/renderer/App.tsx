import { Dir } from "fs";
import React, { useState } from "react";
import "./App.scss";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faCheckSquare,
  faCoffee,
  fas
} from "@fortawesome/free-solid-svg-icons";
import { useSelector } from "react-redux";
import {
  Motion,
  spring,
  TransitionMotion,
  TransitionStyle
} from "react-motion";
import Aside from "./components/Aside";
import { RootState } from "./store";
import { Direction, Page } from "./store/app/types";
import Bucket from "./components/Bucket";
import Transform from "./components/Transform";
import Setting from "./components/Setting";

library.add(fas, faCheckSquare, faCoffee);

function app() {
  const selectAppColor = (state: RootState) => state.app.appColor;
  const appColor = useSelector(selectAppColor);

  const selectPage = (state: RootState) => state.app.page;
  const page = useSelector(selectPage);

  const selectDirection = (state: RootState) => state.app.direction;
  const direction = useSelector(selectDirection);

  const willEnter = () =>
    direction === Direction.down ? { y: 100 } : { y: -100 };
  const willLeave = () =>
    direction === Direction.down ? { y: spring(-100) } : { y: spring(100) };

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
                  {String(Page.transferList) === config.key && <Transform />}
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
