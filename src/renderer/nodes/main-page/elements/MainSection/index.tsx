import React, { FC, useEffect, useState } from "react";
import "./index.scss";

const MainSection: FC = (props) => {
  const { children } = props;
  const [bgOffset, setBgOffset] = useState("0px, 0px");

  useEffect(() => {
    const bgOffsetX = Math.ceil((Math.random() - 0.5) * 800);
    const bgOffsetY = Math.ceil((Math.random() - 0.5) * 600);
    setBgOffset(`${bgOffsetX}px, ${bgOffsetY}px`);
  }, []);

  return (
    <div
      className="main-section"
      style={{
        backgroundPosition: bgOffset,
      }}
    >
      {children}
    </div>
  );
};

export default MainSection;
