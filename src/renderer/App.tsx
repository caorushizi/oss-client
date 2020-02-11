import React from "react";
import "./App.scss";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faCheckSquare, faCoffee, fas } from "@fortawesome/free-solid-svg-icons";
import { useSelector } from "react-redux";
import Aside from "./components/Aside";
import { RootState } from "./store";
import { Page } from "./store/app/types";
import Bucket from "./components/Bucket";
import Transform from "./components/Transform";
import Setting from "./components/Setting";

library.add(fas, faCheckSquare, faCoffee);

function app() {
  const selectAppColor = (state: RootState) => state.app.appColor;
  const appColor = useSelector(selectAppColor);

  const selectPage = (state: RootState) => state.app.page;
  const page = useSelector(selectPage);
  return (
    <div className="App" style={{ background: appColor }}>
      <Aside />
      <section className="main-wrapper">
        {page === Page.bucket && <Bucket />}
        {page === Page.transferList && <Transform />}
        {page === Page.transferDone && <Transform />}
        {page === Page.setting && <Setting />}
      </section>
    </div>
  );
}

export default app;
