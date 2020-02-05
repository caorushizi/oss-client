import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./index.scss";
import { getBuckets } from "../../helper/ipc";
import publicIcon from "./images/public.png";
import aboutIcon from "./images/about.png";
import uploadIcon from "./images/upload.png";
import doneIcon from "./images/done.png";
import settingIcon from "./images/setting.png";

function Aside() {
  const [bucketList, setBucketList] = useState<string[]>([]);

  useEffect(() => {
    getBuckets((event, list) => {
      setBucketList(list);
    });
  }, []);

  return (
    <div className="aside-wrapper">
      <section className="title-bar">
        <span>OSS Client X</span>
      </section>
      <section className="container">
        <p className="title">储存空间</p>
        <ul className="list">
          {bucketList.map(item => (
            <li className="item" key={item}>
              <img className="icon" src={publicIcon} alt="bucket" />
              <Link to={`/bucket/${item}`} title={item}>
                {item}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="container">
        <p className="title">传输列表</p>
        <ul className="list">
          <li className="item active">
            <img className="icon" src={uploadIcon} alt="关于" />
            <Link to="/transform">传输列表</Link>
          </li>
          <li className="item">
            <img className="icon" src={doneIcon} alt="关于" />
            <Link to="/transform">传输完成</Link>
          </li>
        </ul>
      </section>
      <section className="container">
        <p className="title">设置</p>
        <ul className="list">
          <li className="item">
            <img className="icon" src={settingIcon} alt="关于" />
            <Link to="/setting">设置</Link>
          </li>
          <li className="item">
            <img className="icon" src={aboutIcon} alt="关于" />
            <Link to="/setting">关于</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

export default Aside;
