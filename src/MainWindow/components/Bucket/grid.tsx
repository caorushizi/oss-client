import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import "./index.scss";
import Vdir from "../../lib/vdir/vdir";
import { Item } from "../../lib/vdir/types";
import Icon from "../Icon";
import { changeNotifier } from "../../store/app/actions";
import { fileContextMenu, vdirContextMenu } from "../../helper/contextMenu";
import Ffile from "../../lib/vdir/ffile";
import { RootState } from "../../store";

type PropTypes = { vdir: Vdir };

const Grid = ({ vdir }: PropTypes) => {
  const dispatch = useDispatch();
  const [files, setFiles] = useState<Item[]>([]);
  const selectApp = (state: RootState) => state.app;
  const app = useSelector(selectApp);

  useEffect(() => {
    setFiles(vdir.listFiles());
  }, [app.notifier, vdir]);

  return (
    <div className="main-grid">
      {files.length > 0 ? (
        files.map((item: Item) =>
          Vdir.isDir(item) ? (
            // vdir
            <div
              className="main-grid__cell"
              key={item.name}
              onContextMenu={() => vdirContextMenu(item as Vdir)}
              onDoubleClick={() => {
                dispatch(changeNotifier());
                vdir.changeDir(item.name);
                setFiles(vdir.listFiles());
              }}
            >
              <Icon className="icon" />
              <span>{item.name}</span>
            </div>
          ) : (
            // file
            <div
              className="main-grid__cell"
              key={item.name}
              onContextMenu={() => {
                const domain = app.domains.length > 0 ? app.domains[0] : "";
                fileContextMenu(item as Ffile, domain);
              }}
            >
              {(item as Ffile).type.startsWith("image/") &&
              app.domains.length > 0 ? (
                <img
                  className="icon"
                  src={`http://${app.domains[0]}/${
                    (item as Ffile).webkitRelativePath
                  }`}
                  alt={item.name}
                />
              ) : (
                <Icon className="icon" filename={item.name} />
              )}
              <span>{item.name}</span>
            </div>
          )
        )
      ) : (
        <div className="no-files">
          <div className="title">没有文件</div>
          <div className="sub-title">当前 bucket 中没有文件</div>
        </div>
      )}
    </div>
  );
};

export default Grid;
