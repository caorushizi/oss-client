import React, { FC, useRef } from "react";
import { Box, Flex, List, ListItem } from "@chakra-ui/react";
import { Link, useLocation, useOutlet } from "react-router-dom";
import useTheme from "hooks/useTheme";
import DragArea from "../../components/DragArea";
import { TransitionGroup, CSSTransition } from "react-transition-group";

const pathList = [
  /bucket/,
  /transfer-list/,
  /transfer-done/,
  /settings/,
  /apps/,
];

const MainPage: FC = () => {
  const [sideBg, mainBg] = useTheme();
  const location = useLocation();
  const outlet = useOutlet();

  const lastIndex = useRef(0);
  const currentIndex = pathList.findIndex((reg) => reg.test(location.pathname));
  const direction = currentIndex > lastIndex.current ? "down" : "up";
  lastIndex.current = currentIndex;

  return (
    <Flex h={"100vh"}>
      <DragArea />
      <Box w="225px" bgGradient={sideBg}>
        <List>
          <ListItem mb={6}>
            储存空间
            <List>
              <ListItem>
                <Link to="bucket">bucket</Link>
              </ListItem>
            </List>
          </ListItem>
          <ListItem mb={6}>
            传输列表
            <List>
              <ListItem>
                <Link to="transfer-list">传输列表</Link>
              </ListItem>
              <ListItem>
                <Link to="transfer-done">传输完成</Link>
              </ListItem>
            </List>
          </ListItem>
          <ListItem>
            设置
            <List>
              <ListItem>
                <Link to="settings">设置</Link>
              </ListItem>
              <ListItem>
                <Link to="apps">apps</Link>
              </ListItem>
            </List>
          </ListItem>
        </List>
      </Box>
      <Box flex="1" bgGradient={mainBg}>
        <TransitionGroup>
          <CSSTransition
            key={location.key}
            addEndListener={(node, done) => {
              node.addEventListener("transitionend", done, false);
            }}
            classNames={direction}
            timeout={300}
          >
            {outlet}
          </CSSTransition>
        </TransitionGroup>
      </Box>
    </Flex>
  );
};

export default MainPage;
