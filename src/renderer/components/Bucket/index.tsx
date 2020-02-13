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

type Position = { start: number; end: number };

const Bucket = () => {
  console.log("testtest");
  const selectLayout = (state: RootState) => state.app.layout;
  const layout = useSelector(selectLayout);
  const selectVdir = (state: RootState) => state.app.vdir;
  const vdir = useSelector(selectVdir);

  const [position, setPosition] = useState<Position>({ start: 0, end: 0 });

  useEffect(() => {
    setPosition({ start: -100, end: 0 });
    console.log("start", position);
    return () => {
      setPosition({ start: 0, end: -100 });
      console.log("end", position);
    };
  }, []);

  return (
    <div className="bucket-wrapper">
      <button
        type="button"
        onClick={() => {
          setPosition({ start: 0, end: -100 });
        }}
      >
        test
      </button>
      <Buttons />
      <ToolBar />
      {Layout.grid === layout ? <Grid vdir={vdir} /> : <Table vdir={vdir} />}
      <Footer />
    </div>
  );
};

export default Bucket;
