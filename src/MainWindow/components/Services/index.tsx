import React, { useEffect, useState } from "react";

import "./index.scss";
import { AppStore } from "../../../main/store/apps";
import { addApp, getAppsChannel } from "../../ipc";
import ServicesList from "./ServicesList";
import ServicesNewItem from "./ServicesNewItem";
import ServicesUpdateItem from "./ServicesUpdateItem";
import { OssType } from "../../../main/types";

type PropTypes = {
  onOssChange: (id: string) => void;
};

const Apps = ({ onOssChange }: PropTypes) => {
  const [apps, setApps] = useState<AppStore[]>([]);
  const [currentApp, setCurrentApp] = useState<AppStore>();

  const onBucketUpdate = () => {};
  const onBucketDelete = () => {};
  const onBucketAdd = async (
    name: string,
    ak: string,
    sk: string,
    type: number
  ) => {
    const app = await addApp(name, type, ak, sk);
  };
  const onOssAddClick = () => {
    const current = { name: "新建", ak: "", sk: "", type: OssType.qiniu };
    setApps([...apps, current]);
    setCurrentApp(current);
  };
  const onOssSelect = (id: string) => {
    const s = apps.find(i => i._id === id);
    setCurrentApp(s);
  };

  const OssForm = () => {
    if (currentApp && currentApp._id) {
      return (
        <ServicesUpdateItem
          activeOss={currentApp}
          onBucketUpdate={onBucketUpdate}
          onBucketDelete={onBucketDelete}
        />
      );
    }
    if (currentApp && !currentApp._id) {
      return <ServicesNewItem onBucketAdd={onBucketAdd} />;
    }
    return (
      <div className="no-result">
        <p>没有 Apps</p>
        <p>暂时没有搜索到 apps</p>
      </div>
    );
  };

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
          ossList={apps}
          activeOss={currentApp?._id}
          onOssAddClick={onOssAddClick}
          onOssChange={onOssChange}
          onOssSelect={onOssSelect}
        />
        <OssForm />
      </section>
    </div>
  );
};

export default Apps;
