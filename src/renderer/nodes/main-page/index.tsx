import React, { FC } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { Link, Outlet, useLocation } from "react-router-dom";

const MainPage: FC = () => {
  const location = useLocation();

  console.log(location);
  return (
    <Flex h={"100vh"}>
      <Box w="225px" bg="green.500">
        <Link to={"bucket"}>bucket</Link>
        <br />
        <Link to={"transfer-list"}>list</Link>
        <br />
        <Link to={"transfer-done"}>done</Link>
        <br />
        <Link to={"settings"}>settings</Link>
        <br />
        <Link to={"apps"}>apps</Link>
        <br />
        <Link to={"/"}>/回到首页</Link>
      </Box>
      <Box flex="1" bg="tomato">
        <Outlet />
      </Box>
    </Flex>
  );
};

export default MainPage;
