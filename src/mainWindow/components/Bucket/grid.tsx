import React, { useEffect, useState } from "react";
import "./index.scss";
import Vdir from "../../lib/vdir/vdir";
import { Item } from "../../lib/vdir/types";
import Icon from "../Icon";

const Grid = ({ vdir }: { vdir: Vdir }) => {
  const [files, setFiles] = useState<Item[]>([]);

  useEffect(() => {
    setFiles(vdir.listFiles());
  }, [vdir]);

  return (
    <div className="main-grid">
      {files.map((item: Item) =>
        Vdir.isDir(item) ? (
          <div className="main-grid__cell" key={item.name}>
            <Icon className="icon" />
            <span>{item.name}</span>
          </div>
        ) : (
          <div className="main-grid__cell" key={item.name}>
            <Icon className="icon" filename={item.name} />
            <span>{item.name}</span>
          </div>
        )
      )}
    </div>
  );
};

export default Grid;
