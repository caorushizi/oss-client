import React, { FC, useEffect, useState } from "react";
import "./index.scss";
import { Flex, Icon } from "@chakra-ui/react";
import {
  AiFillCloseCircle,
  AiFillMinusCircle,
  AiFillPlusCircle,
} from "react-icons/ai";

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
      <Flex h={10} px={3.5} alignItems={"center"} justifyContent={"flex-end"}>
        <Icon
          ml={3.5}
          color={"whiteAlpha.600"}
          as={AiFillMinusCircle}
          onClick={() => {
            console.log("最小化");
          }}
        />
        <Icon
          ml={3.5}
          color={"whiteAlpha.600"}
          as={AiFillPlusCircle}
          onClick={() => {
            console.log("最大化");
          }}
        />
        <Icon
          ml={3.5}
          color={"whiteAlpha.600"}
          as={AiFillCloseCircle}
          onClick={() => {
            console.log("关闭");
          }}
        />
      </Flex>
      {children}
    </div>
  );
};

export default MainSection;
