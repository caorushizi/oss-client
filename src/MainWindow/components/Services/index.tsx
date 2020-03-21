import React, { useEffect, useState } from "react";

import "./index.scss";
import { AppStore } from "../../../main/store/apps";
import { addApp, getAppsChannel } from "../../ipc";
import ServicesList from "./ServicesList";
import AddOssForm from "./AddOssForm";
import UpdateOssForm from "./UpdateOssForm";
import { OssType } from "../../../main/types";
import useKeyPress from "../../hooks/useKeyPress";
import { KeyCode } from "../../types";

type NewAppStore = {
  _id?: string;
  type: OssType;
  ak: string;
  sk: string;
  name: string;
  bucket: string;
  uploadBucket: string;
  uploadPrefix: string;
  isNew: boolean;
};

type PropTypes = {
  onOssActive: (item: AppStore) => void;
};

const Services = ({ onOssActive }: PropTypes) => {
  const [apps, setApps] = useState<(AppStore | NewAppStore)[]>([]);
  const [currentApp, setCurrentApp] = useState<AppStore>();
  const escapePress = useKeyPress(KeyCode.Escape);
  const [hasNew, setHasNew] = useState<boolean>(false);

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
    if (apps.filter(i => (i as NewAppStore).isNew).length > 0) return;
    const current: NewAppStore = {
      name: "新建",
      ak: "",
      sk: "",
      type: OssType.qiniu,
      bucket: "",
      uploadPrefix: "",
      uploadBucket: "",
      isNew: true
    };
    setApps([...apps, current]);
    setCurrentApp(current);
    setHasNew(true);
  };
  const _onOssSelect = (id: string) => {
    const s = apps.find(i => i._id === id);
    if (s) {
      onOssActive(s);
      setCurrentApp(s);
    }
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
          hasNew={hasNew}
          ossList={apps}
          activeOss={currentApp?._id}
          onOssAddClick={onOssAddClick}
          onOssSelect={_onOssSelect}
        />
        {currentApp && (
          <div className="main-right_form_container">
            <div className="main-right_form_title">未命名</div>
            {currentApp._id ? (
              <UpdateOssForm
                activeOss={currentApp}
                onBucketUpdate={onBucketUpdate}
                onBucketDelete={onBucketDelete}
              />
            ) : (
              <AddOssForm onBucketAdd={onBucketAdd} />
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Services;
