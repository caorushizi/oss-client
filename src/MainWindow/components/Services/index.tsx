import React, { useEffect, useState } from "react";

import "./index.scss";
import { AppStore } from "../../../main/store/apps";
import { getAppsChannel } from "../../ipc";
import ServicesList from "./ServicesList";
import ServicesNewItem from "./ServicesNewItem";
import ServicesUpdateItem from "./ServicesUpdateItem";

const Apps = () => {
  const [apps, setApps] = useState<AppStore[]>([]);
  const [currentApp, setCurrentApp] = useState<AppStore>();

  useEffect(() => {
    getAppsChannel().then(allApps => {
      setApps(allApps);
      if (!currentApp) {
        setCurrentApp(allApps[0]);
      }
    });
  }, []);

  return (
    <div className="apps-wrapper">
      <section className="apps-main">
        <ServicesList
          ossList={[]}
          activeOssAk=""
          onOssAddClick={() => {}}
          onOssChange={() => {}}
          onOssSelect={() => {}}
        />
        <ServicesNewItem />
        <ServicesUpdateItem activeOss={{}} />
        <div className="no-result">
          <p>没有 Apps</p>
          <p>暂时没有搜索到 apps</p>
        </div>
      </section>
    </div>
  );
};

export default Apps;
