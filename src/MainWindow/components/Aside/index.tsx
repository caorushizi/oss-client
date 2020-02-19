import React, { useEffect, useState } from "react";
import "./index.scss";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { ipcRenderer, IpcRendererEvent } from "electron";
import { getBuckets, getFiles } from "../../helper/ipc";
import { RootState } from "../../store";
import {
  randomColor,
  setTransfers,
  setVdir,
  switchPage
} from "../../store/app/actions";
import { Page } from "../../store/app/types";
import { Vdir } from "../../lib/vdir";
import { qiniuAdapter } from "../../lib/adapter/qiniu";
import Loading from "../Loading";

function Aside() {
  const [bucketList, setBucketList] = useState<string[]>([]);
  const selectAsideColor = (state: RootState) => state.app.asideColor;
  const asideColor = useSelector(selectAsideColor);
  const dispatch = useDispatch();

  const selectPage = (state: RootState) => state.app.page;
  const page = useSelector(selectPage);
  const selectBucket = (state: RootState) => state.app.bucket;
  const bucket = useSelector(selectBucket);

  const [curBucket, setCurBucket] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    dispatch(randomColor());
  }, [bucket, page]);

  useEffect(() => {
    setLoading(true);
    getBuckets((event, list: string[]) => {
      // todo: 保存 cur bucket
      setBucketList(list);
      if (list.length > 0) {
        getFiles(list[0]);
        setCurBucket(list[0]);
      }
    });

    ipcRenderer.on("transfers-reply", (event, documents) => {
      dispatch(setTransfers(documents));
      dispatch(switchPage(Page.transferDone));
    });

    ipcRenderer.on("transmitting-reply", (event, documents) => {
      dispatch(setTransfers(documents));
      dispatch(switchPage(Page.transferList));
    });
  }, []);

  useEffect(() => {
    const getFilesResponse = (
      event: IpcRendererEvent,
      { items }: { items: string[] }
    ) => {
      const dir = Vdir.from(qiniuAdapter(items));
      dispatch(setVdir(dir));
      dispatch(switchPage(Page.bucket, curBucket));
      setLoading(false);
    };

    ipcRenderer.on("get-files-response", getFilesResponse);
    return () => {
      ipcRenderer.removeListener("get-files-response", getFilesResponse);
    };
  }, [curBucket]);

  return (
    <div className="aside-wrapper" style={{ background: asideColor }}>
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
                active: page === Page.bucket && bucket === bucketName
              })}
              key={bucketName}
            >
              <FontAwesomeIcon className="icon" icon="folder" />
              <input
                type="button"
                className="link"
                onClick={() => {
                  getFiles(bucketName);
                  setCurBucket(bucketName);
                  setLoading(true);
                }}
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
              active: page === Page.transferList
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
              active: page === Page.transferDone
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
          <li className={classNames("item", { active: page === Page.setting })}>
            <FontAwesomeIcon className="icon" icon="cog" />
            <input
              type="button"
              value="设置"
              className="link"
              onClick={() => dispatch(switchPage(Page.setting))}
            />
          </li>
          <li className={classNames("item", { active: page === Page.apps })}>
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
