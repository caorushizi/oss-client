import React, { useEffect, useState } from "react";
import "./index.scss";
import { useSelector } from "react-redux";
import FileDrop from "react-file-drop";
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
  const styles = {
    border: "1px solid black",
    width: 600,
    color: "black",
    padding: 20
  };

  return (
    <div className="bucket-wrapper">
      <div style={styles}>
        <FileDrop
          onDrop={files => {
            console.log(files);
          }}
        />
      </div>

      <Buttons vdir={vdir} />
      <ToolBar vdir={vdir} />
      {Layout.grid === layout ? <Grid vdir={vdir} /> : <Table vdir={vdir} />}
      <Footer vdir={vdir} />
    </div>
  );
};

export default Bucket;
