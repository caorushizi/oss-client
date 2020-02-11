// eslint-disable-next-line import/no-extraneous-dependencies
import { ipcRenderer } from "electron";
import React from "react";
import "./index.scss";
import { useSelector } from "react-redux";
import OssButton from "../OssButton";
import ToolBar from "./toolbar";
import Table from "./table";
import { Layout } from "../../store/app/types";
import { RootState } from "../../store";
import Grid from "./grid";
import Footer from "./footer";

const Bucket = () => {
  const selectLayout = (state: RootState) => state.app.layout;
  const layout = useSelector(selectLayout);
  const selectVdir = (state: RootState) => state.app.vdir;
  const vdir = useSelector(selectVdir);

  return (
    <div className="bucket-wrapper">
      <section>
        <OssButton
          value="上传"
          onClick={() => {
            ipcRenderer.send(
              "req:file:upload",
              "downloads",
              "/",
              "C:\\Users\\admin\\Desktop\\刁振源-2019年终总结.docx"
            );
          }}
        />
        <OssButton
          value="回到根目录"
          onClick={() => {
            // vdir.back();
            // setFiles(vdir.listFiles());
          }}
        />
      </section>
      <ToolBar />
      {Layout.grid === layout ? <Grid vdir={vdir} /> : <Table vdir={vdir} />}
      <Footer />
    </div>
  );
};

export default Bucket;
