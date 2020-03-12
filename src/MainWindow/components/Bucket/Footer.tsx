import React, { useEffect, useState } from "react";
import "./index.scss";
import { useSelector } from "react-redux";
import Vdir from "../../lib/vdir/vdir";
import { RootState } from "../../store";

type PropTypes = {
  totalItem: number;
  selectedItem: number;
  domains: string[];
};

const Footer = ({ totalItem, selectedItem, domains }: PropTypes) => {
  return (
    <div className="footer">
      <div className="footer-left">
        <span className="current-select">{`选中${selectedItem}项`}</span>
        <span className="current-total">{`/总共${totalItem}项`}</span>
      </div>
      <span>{domains.length > 0 ? domains[0] : "没有绑定域名"}</span>
    </div>
  );
};

export default Footer;
