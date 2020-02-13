import React, { useEffect, useState } from "react";
import "./index.scss";
import { useSelector } from "react-redux";
import ToolBar from "./toolbar";
import Table from "./table";
import { Layout } from "../../store/app/types";
import { RootState } from "../../store";
import Grid from "./grid";
import Footer from "./footer";
import Buttons from "./buttons";

const Bucket = () => {
  const selectLayout = (state: RootState) => state.app.layout;
  const layout = useSelector(selectLayout);
  const selectVdir = (state: RootState) => state.app.vdir;
  const vdir = useSelector(selectVdir);

  return (
    <div className="bucket-wrapper">
      <Buttons />
      <ToolBar />
      {Layout.grid === layout ? <Grid vdir={vdir} /> : <Table vdir={vdir} />}
      <Footer />
    </div>
  );
};

export default Bucket;
