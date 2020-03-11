import React, { useEffect } from "react";
import "./index.scss";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { RootState } from "../../store";
import { randomColor } from "../../store/app/actions";
import { Page } from "../../store/app/types";
import Loading from "../BaseLoading";

type PropTypes = {
  bucketList: string[];
  bucketLoading: boolean;
  activeBucket: string;
  activePage: Page;
  tabChange: (page: Page, bucket?: string) => void;
};

function TheSidebar({
  bucketList,
  bucketLoading,
  activeBucket,
  activePage,
  tabChange
}: PropTypes) {
  const dispatch = useDispatch();

  const selectApp = (state: RootState) => state.app;
  const app = useSelector(selectApp);

  useEffect(() => {
    dispatch(randomColor());
  }, [activeBucket, activePage]);

  const activeTag = (page: Page, bucket?: string) => ({
    active: activePage === page && activeBucket === bucket
  });

  return (
    <div className="aside-wrapper" style={{ background: app.asideColor }}>
      <section className="title-bar">
        <span>OSS Client</span>
      </section>
      <section className="container">
        <div className="title">
          储存空间
          {bucketLoading && <Loading className="loading" />}
        </div>
        <ul className="list">
          {bucketList.map((bucket: string) => (
            <li
              className={classNames("item", activeTag(Page.bucket, bucket))}
              key={bucket}
            >
              <FontAwesomeIcon className="icon" icon="folder" />
              <input
                type="button"
                className="link"
                onClick={() => tabChange(Page.bucket, bucket)}
                title={bucket}
                value={bucket}
              />
            </li>
          ))}
        </ul>
      </section>
      <section className="container">
        <div className="title">传输列表</div>
        <ul className="list">
          <li className={classNames("item", activeTag(Page.transferList))}>
            <FontAwesomeIcon className="icon" icon="arrow-up" />
            <input
              type="button"
              value="传输列表"
              className="link"
              onClick={() => tabChange(Page.transferList)}
            />
          </li>
          <li className={classNames("item", activeTag(Page.transferDone))}>
            <FontAwesomeIcon className="icon" icon="check-circle" />
            <input
              type="button"
              value="传输完成"
              className="link"
              onClick={() => tabChange(Page.transferDone)}
            />
          </li>
        </ul>
      </section>
      <section className="container">
        <div className="title">设置</div>
        <ul className="list">
          <li className={classNames("item", activeTag(Page.setting))}>
            <FontAwesomeIcon className="icon" icon="cog" />
            <input
              type="button"
              value="设置"
              className="link"
              onClick={() => tabChange(Page.setting)}
            />
          </li>
          <li className={classNames("item", activeTag(Page.apps))}>
            <FontAwesomeIcon className="icon" icon="rocket" />
            <input
              type="button"
              value="apps"
              className="link"
              onClick={() => tabChange(Page.apps)}
            />
          </li>
        </ul>
      </section>
    </div>
  );
}

export default TheSidebar;

// TODO: 修改 传输列表和传输完成的组件名
// TODO: 修改组件内部命名
