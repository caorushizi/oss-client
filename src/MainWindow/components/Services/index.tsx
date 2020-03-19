import React, { useEffect, useState } from "react";

import "./index.scss";
import { AppStore } from "../../../main/store/apps";
import { addApp, getAppsChannel } from "../../ipc";
import ServicesList from "./ServicesList";
import ServicesNewItem from "./ServicesNewItem";
import ServicesUpdateItem from "./ServicesUpdateItem";
import { OssType } from "../../../main/types";
import useKeyPress from "../../hooks/useKeyPress";
import { KeyCode } from "../../types";

type PropTypes = {
  onOssChange: (id: string) => void;
  onOssActive: (name: AppStore) => void;
};

const Services = ({ onOssChange, onOssActive }: PropTypes) => {
  const [apps, setApps] = useState<AppStore[]>([]);
  const [currentApp, setCurrentApp] = useState<AppStore>();
  const escapePress = useKeyPress(KeyCode.Escape);

  useEffect(() => {
    console.log("123");
  }, [escapePress]);

  const onBucketUpdate = () => {};
  const onBucketDelete = () => {};
  const onBucketAdd = async (
    name: string,
    ak: string,
    sk: string,
    type: number
  ) => {
    await addApp(name, type, ak, sk);
  };
  const onOssAddClick = () => {
    const current = { name: "新建", ak: "", sk: "", type: OssType.qiniu };
    setApps([...apps, current]);
    setCurrentApp(current);
  };
  const _onOssSelect = (id: string) => {
    const s = apps.find(i => i._id === id);
    if (s) {
      onOssActive(s);
      setCurrentApp(s);
    }
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
    return <div />;
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
    <div className="services-wrapper">
      <section className="apps-main">
        <ServicesList
          ossList={apps}
          activeOss={currentApp?._id}
          onOssAddClick={onOssAddClick}
          onOssChange={onOssChange}
          onOssSelect={_onOssSelect}
        />
        <OssForm />
      </section>
    </div>
  );
};

export default Services;
