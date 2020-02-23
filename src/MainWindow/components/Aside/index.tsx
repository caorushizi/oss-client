import React, { useEffect, useState } from "react";
import "./index.scss";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { ipcRenderer } from "electron";
import { RootState } from "../../store";
import {
  randomColor,
  setDomains,
  setTransfers,
  setVdir,
  switchPage
} from "../../store/app/actions";
import { Page } from "../../store/app/types";
import { Vdir } from "../../lib/vdir";
import { qiniuAdapter } from "../../lib/adapter/qiniu";
import Loading from "../Loading";
import { getbuckets, switchBucket } from "../../ipc";

function Aside() {
  const dispatch = useDispatch();
  const [bucketList, setBucketList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const selectApp = (state: RootState) => state.app;
  const app = useSelector(selectApp);

  const handleSwitchBucket = async (bucketName: string) => {
    setLoading(true);
    const bucketObj = await switchBucket(bucketName);
    const dir = Vdir.from(qiniuAdapter(bucketObj.files));
    dispatch(setVdir(dir));
    dispatch(switchPage(Page.bucket, bucketName));
    dispatch(setDomains(bucketObj.domains));
    setLoading(false);
  };

  const handleGetBuckets = async () => {
    const buckets = await getbuckets();
    // todo: 保存 cur bucket
    setBucketList(buckets);
    if (buckets.length > 0) {
      const bucketName = buckets[0];
      await handleSwitchBucket(bucketName);
    }
  };

  useEffect(() => {
    dispatch(randomColor());
  }, [app.bucket, app.page]);

  useEffect(() => {
    setLoading(true);
    handleGetBuckets();

    ipcRenderer.on("transfers-reply", (event, documents) => {
      dispatch(setTransfers(documents));
      dispatch(switchPage(Page.transferDone));
    });

    ipcRenderer.on("transmitting-reply", (event, documents) => {
      dispatch(setTransfers(documents));
      dispatch(switchPage(Page.transferList));
    });
  }, []);

  return (
    <div className="aside-wrapper" style={{ background: app.asideColor }}>
      <section className="title-bar">
        <span>OSS Client</span>
      </section>
      <section className="container">
        <div className="title">
          储存空间
          {loading && <Loading className="loading" />}
        </div>
        <ul className="list">
          {bucketList.map((bucketName: string) => (
            <li
              className={classNames("item", {
                active: app.page === Page.bucket && app.bucket === bucketName
              })}
              key={bucketName}
            >
              <FontAwesomeIcon className="icon" icon="folder" />
              <input
                type="button"
                className="link"
                onClick={() => handleSwitchBucket(bucketName)}
                title={bucketName}
                value={bucketName}
              />
            </li>
          ))}
        </ul>
      </section>
      <section className="container">
        <div className="title">传输列表</div>
        <ul className="list">
          <li
            className={classNames("item", {
              active: app.page === Page.transferList
            })}
          >
            <FontAwesomeIcon className="icon" icon="arrow-up" />
            <input
              type="button"
              value="传输列表"
              className="link"
              onClick={() => ipcRenderer.send("transmitting")}
            />
          </li>
          <li
            className={classNames("item", {
              active: app.page === Page.transferDone
            })}
          >
            <FontAwesomeIcon className="icon" icon="check-circle" />
            <input
              type="button"
              value="传输完成"
              className="link"
              onClick={() => ipcRenderer.send("transfers")}
            />
          </li>
        </ul>
      </section>
      <section className="container">
        <div className="title">设置</div>
        <ul className="list">
          <li
            className={classNames("item", {
              active: app.page === Page.setting
            })}
          >
            <FontAwesomeIcon className="icon" icon="cog" />
            <input
              type="button"
              value="设置"
              className="link"
              onClick={() => dispatch(switchPage(Page.setting))}
            />
          </li>
          <li
            className={classNames("item", { active: app.page === Page.apps })}
          >
            <FontAwesomeIcon className="icon" icon="rocket" />
            <input
              type="button"
              value="apps"
              className="link"
              onClick={() => dispatch(switchPage(Page.apps))}
            />
          </li>
        </ul>
      </section>
    </div>
  );
}

export default Aside;
