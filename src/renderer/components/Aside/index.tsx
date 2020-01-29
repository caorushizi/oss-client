import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./index.scss";
import { getBuckets } from "../../helper/ipc";

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
        <p className="title">buckets</p>
        <ul className="list">
          {bucketList.map(item => (
            <li className="item" key={item}>
              <Link to={`/bucket/${item}`} title={item}>
                {item}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="container">
        <p className="title">传输</p>
        <ul className="list">
          <li className="item active">
            <Link to="/transform">传输列表</Link>
          </li>
          <li className="item">
            <Link to="/transform">传输完成</Link>
          </li>
        </ul>
      </section>
      <section className="container">
        <p className="title">设置</p>
        <ul className="list">
          <li className="item">
            <Link to="/setting">设置</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

export default Aside;
