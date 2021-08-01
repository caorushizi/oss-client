import React, { FC } from "react";
import { Box, Flex, Icon } from "@chakra-ui/react";
import { Route, Switch, useLocation } from "react-router-dom";
import useTheme from "hooks/useTheme";
import DragArea from "../../components/DragArea";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import Bucket from "./bucket";
import TransferList from "./transfer-done";
import TransferDone from "./transfer-list";
import Settings from "./settings";
import Apps from "./apps";
import useSwitch from "hooks/useSwitch";
import SideBar from "./elements/SideBar";
import "./index.scss";
import {
  AiFillMinusCircle,
  AiFillPlusCircle,
  AiFillCloseCircle,
} from "react-icons/ai";

// 主页面
const MainPage: FC = () => {
  const location = useLocation();
  const [sideBg, mainBg] = useTheme();
  const [jumpInfo, jump] = useSwitch(location.pathname);

  return (
    <Flex h={"100vh"} className={"main-page"}>
      <DragArea />
      <Box w="225px" bgGradient={sideBg}>
        <SideBar jump={jump} />
      </Box>
      <Box flex="1" bgGradient={mainBg}>
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
        <TransitionGroup className={"main-wrapper"}>
          <CSSTransition
            key={location.key}
            classNames={jumpInfo.direction}
            timeout={jumpInfo.duration}
            unmountOnExit
          >
            <Switch location={location}>
              <Route path="/main/bucket/:id" component={Bucket} />
              <Route path="/main/transfer-list" component={TransferList} />
              <Route path="/main/transfer-done" component={TransferDone} />
              <Route path="/main/settings" component={Settings} />
              <Route path="/main/apps" component={Apps} />
            </Switch>
          </CSSTransition>
        </TransitionGroup>
      </Box>
    </Flex>
  );
};

export default MainPage;
