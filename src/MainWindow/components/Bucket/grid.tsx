import React, { useEffect, useState } from "react";
import "./index.scss";
import { useDispatch, useSelector } from "react-redux";
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
  const selectNotifier = (state: RootState) => state.app.notifier;
  const notifier = useSelector(selectNotifier);

  useEffect(() => {
    setFiles(vdir.listFiles());
  }, [notifier]);

  return (
    <div className="main-grid">
      {files.map((item: Item) =>
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
              console.log(vdir.getNav());
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
            onContextMenu={() => fileContextMenu(item as Ffile)}
          >
            <Icon className="icon" filename={item.name} />
            <span>{item.name}</span>
          </div>
        )
      )}
    </div>
  );
};

export default Grid;
