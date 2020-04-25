import React, { useEffect, useState } from "react";

import "./index.scss";
import { addApp, getAppsChannel, updateApp, deleteApp } from "../../helper/ipc";
import ServicesList from "./ServicesList";
import AddOssForm from "./AddOssForm";
import UpdateOssForm from "./UpdateOssForm";
import { AppStore, OssType } from "../../../main/types";
import useKeyPress from "../../hooks/useKeyPress";
import { KeyCode } from "../../helper/enums";

type NewAppStore = {
  _id?: string;
  type: OssType;
  ak: string;
  sk: string;
  name: string;
  bucket: string;
  uploadBucket: string;
  uploadPrefix: string;
  defaultDomain: string;
  isNew: boolean;
};

type PropTypes = {
  onOssActive: (item: AppStore) => void;
};

const Services = ({ onOssActive }: PropTypes) => {
  const [apps, setApps] = useState<(AppStore | NewAppStore)[]>([]);
  const [currentApp, setCurrentApp] = useState<AppStore>();
  const [hasNew, setHasNew] = useState<boolean>(false);
  const escapePress = useKeyPress(KeyCode.Escape);

  const onBucketUpdate = (store: AppStore) => {
    console.log("新的App：", store);
    updateApp(store)
      .then(() => {
        return getAppsChannel();
      })
      .then(allApps => {
        setApps(allApps);
        const currentStore = allApps.find(i => i._id === store._id);
        if (currentStore) {
          onOssActive(currentStore);
          setCurrentApp(currentStore);
        }
        // eslint-disable-next-line no-alert
        alert("修改成功！");
      });
  };
  const onBucketDelete = (store: AppStore) => {
    deleteApp(store)
      .then(() => {
        return getAppsChannel();
      })
      .then(allApps => {
        setApps(allApps);
        setCurrentApp(allApps[0]);
        onOssActive(allApps[0]);
      });
  };
  const onBucketAdd = (name: string, ak: string, sk: string, type: OssType) => {
    addApp(name, type, ak, sk)
      .then(() => {
        return getAppsChannel();
      })
      .then(allApps => {
        setApps(allApps);
        const addedApp = allApps.find(i => i.sk === sk);
        if (addedApp) {
          setCurrentApp(addedApp);
          onOssActive(addedApp);
        } else {
          setCurrentApp(allApps[0]);
          onOssActive(allApps[0]);
        }
        setHasNew(false);
      });
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
      defaultDomain: "",
      isNew: true
    };
    setApps([...apps, current]);
    setCurrentApp(current);
    setHasNew(true);
  };
  const _onOssSelect = (id: string) => {
    const ossList = apps.filter(i => i._id);
    setApps(ossList);
    setHasNew(false);
    const selected = ossList.find(i => i._id === id);
    if (selected) {
      setCurrentApp(selected);
      onOssActive(selected);
    }
  };

  useEffect(() => {
    getAppsChannel().then(allApps => {
      setApps(allApps);
      setCurrentApp(allApps[0]);
    });
  }, []);

  useEffect(() => {
    const ossList = apps.filter(i => i._id);
    if (ossList.length > 0) {
      setApps(ossList);
      setHasNew(false);
      setCurrentApp(ossList[0]);
      onOssActive(ossList[0]);
    }
  }, [escapePress]);
  // fixme: 在上下切换的时候宽度增加

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
            <div className="main-right_form_title">修改配置</div>
            {currentApp._id ? (
              <UpdateOssForm
                key={currentApp._id}
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
