import React, { FC } from "react";
import {
  HStack,
  List,
  ListItem,
  Text,
  ListIcon,
  Box,
  Flex,
  CircularProgress,
} from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import {
  AiOutlineDownload,
  AiOutlineCheckCircle,
  AiOutlineBlock,
} from "react-icons/ai";
import { IoSettingsOutline } from "react-icons/io5";
import { VscFolder } from "react-icons/vsc";

type Props = {
  jump: (path: string) => void;
};

const SideBar: FC<Props> = (props) => {
  const { pathname } = useLocation();
  const { jump } = props;

  return (
    <Box>
      <Flex
        h={10}
        px={4}
        alignItems={"center"}
        justifyContent={"flex-end"}
        color={"rgba(255, 255, 255, 0.65)"}
      >
        <Text>OSS Client</Text>
      </Flex>
      <List spacing={6}>
        <ListItem>
          <Text fontSize={14} px={3} color={"whiteAlpha.700"} mb={2.5}>
            储存空间
          </Text>
          <List spacing={0.5} variant={"sidebar"}>
            <ListItem
              onClick={() => jump("/main/bucket/1")}
              color={pathname.startsWith("/main/bucket") ? "white" : undefined}
              bg={
                pathname.startsWith("/main/bucket")
                  ? "rgba(0, 0, 0, 0.15)"
                  : undefined
              }
              _hover={{
                bg: pathname.startsWith("/main/bucket")
                  ? "rgba(0, 0, 0, 0.15)"
                  : undefined,
              }}
            >
              <Box d={"flex"} alignItems={"center"} h={6}>
                <ListIcon as={VscFolder} />
                bucket
              </Box>
            </ListItem>
          </List>
        </ListItem>
        <ListItem>
          <HStack fontSize={14} px={3} mb={2.5} alignItems={"center"}>
            <Text color={"whiteAlpha.700"}>传输列表</Text>
            <CircularProgress
              trackColor={"rgba(255, 255, 255, 0.15)"}
              size={3}
              capIsRound
              value={30}
              color="whiteAlpha.600"
              thickness={20}
            />
          </HStack>
          <List spacing={0.5} variant={"sidebar"}>
            <ListItem
              onClick={() => jump("/main/transfer-list")}
              color={
                pathname.startsWith("/main/transfer-list") ? "white" : undefined
              }
              bg={
                pathname.startsWith("/main/transfer-list")
                  ? "rgba(0, 0, 0, 0.15)"
                  : undefined
              }
              _hover={{
                bg: pathname.startsWith("/main/transfer-list")
                  ? "rgba(0, 0, 0, 0.15)"
                  : undefined,
              }}
            >
              <Box d={"flex"} alignItems={"center"} h={6}>
                <ListIcon as={AiOutlineDownload} />
                传输列表
              </Box>
            </ListItem>
            <ListItem
              onClick={() => jump("/main/transfer-done")}
              color={
                pathname.startsWith("/main/transfer-done") ? "white" : undefined
              }
              bg={
                pathname.startsWith("/main/transfer-done")
                  ? "rgba(0, 0, 0, 0.15)"
                  : undefined
              }
              _hover={{
                bg: pathname.startsWith("/main/transfer-done")
                  ? "rgba(0, 0, 0, 0.15)"
                  : undefined,
              }}
            >
              <Box d={"flex"} alignItems={"center"} h={6}>
                <ListIcon as={AiOutlineCheckCircle} />
                传输完成
              </Box>
            </ListItem>
          </List>
        </ListItem>
        <ListItem>
          <HStack fontSize={14} px={3} mb={2.5}>
            <Text color={"whiteAlpha.700"}>设置</Text>
          </HStack>
          <List spacing={0.5} variant={"sidebar"}>
            <ListItem
              onClick={() => jump("/main/settings")}
              color={
                pathname.startsWith("/main/settings") ? "white" : undefined
              }
              bg={
                pathname.startsWith("/main/settings")
                  ? "rgba(0, 0, 0, 0.15)"
                  : undefined
              }
              _hover={{
                bg: pathname.startsWith("/main/settings")
                  ? "rgba(0, 0, 0, 0.15)"
                  : undefined,
              }}
            >
              <Box d={"flex"} alignItems={"center"} h={6}>
                <ListIcon as={IoSettingsOutline} />
                设置
              </Box>
            </ListItem>
            <ListItem
              onClick={() => jump("/main/apps")}
              color={pathname.startsWith("/main/apps") ? "white" : undefined}
              bg={
                pathname.startsWith("/main/apps")
                  ? "rgba(0, 0, 0, 0.15)"
                  : undefined
              }
              _hover={{
                bg: pathname.startsWith("/main/apps")
                  ? "rgba(0, 0, 0, 0.15)"
                  : undefined,
              }}
            >
              <Box d={"flex"} alignItems={"center"} h={6}>
                <ListIcon as={AiOutlineBlock} />
                apps
              </Box>
            </ListItem>
          </List>
        </ListItem>
      </List>
    </Box>
  );
};

export default SideBar;
