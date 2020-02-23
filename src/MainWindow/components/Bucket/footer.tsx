import React, { useEffect, useState } from "react";
import "./index.scss";
import { useSelector } from "react-redux";
import Vdir from "../../lib/vdir/vdir";
import { RootState } from "../../store";

type PropTypes = { vdir: Vdir };

const Footer = ({ vdir }: PropTypes) => {
  const [totalItem, setTotalItem] = useState<number>(0);
  const selectNotifier = (state: RootState) => state.app.notifier;
  const notifier = useSelector(selectNotifier);

  const selectDomains = (state: RootState) => state.app.domains;
  const domains = useSelector(selectDomains);

  useEffect(() => {
    setTotalItem(vdir.getTotalItem());
  }, [notifier, vdir]);

  return (
    <div className="footer">
      <div className="footer-left">
        <span className="current-select">{`选中${0}项`}</span>
        <span className="current-total">{`/总共${totalItem}项`}</span>
      </div>
      <span>{domains.length > 0 ? domains[0] : "没有绑定域名"}</span>
    </div>
  );
};

export default Footer;
