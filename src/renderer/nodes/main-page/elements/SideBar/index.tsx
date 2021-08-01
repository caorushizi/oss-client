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
  const location = useLocation();
  const { jump } = props;
  return (
    <List>
      <Flex
        h={10}
        px={4}
        alignItems={"center"}
        justifyContent={"flex-end"}
        color={"rgba(255, 255, 255, 0.65)"}
      >
        <Text>OSS Client</Text>
      </Flex>
      <ListItem mb={6}>
        <Text fontSize={14} px={4} color={"whiteAlpha.700"} mb={2.5}>
          储存空间
        </Text>
        <List>
          <ListItem
            onClick={() => jump("/main/bucket/1")}
            cursor={"pointer"}
            mx={2}
            px={3}
            borderRadius={10}
            fontSize={12}
            color={
              location.pathname.startsWith("/main/bucket")
                ? "white"
                : "whiteAlpha.700"
            }
            bg={
              location.pathname.startsWith("/main/bucket")
                ? "rgba(0, 0, 0, 0.15)"
                : ""
            }
            _hover={{
              color: "white",
              bg: location.pathname.startsWith("/main/bucket")
                ? "rgba(0, 0, 0, 0.15)"
                : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <Box d={"flex"} alignItems={"center"} h={6}>
              <ListIcon as={VscFolder} />
              bucket
            </Box>
          </ListItem>
        </List>
      </ListItem>
      <ListItem mb={6}>
        <HStack fontSize={14} px={4} mb={2.5} alignItems={"center"}>
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
        <List>
          <ListItem
            onClick={() => jump("/main/transfer-list")}
            cursor={"pointer"}
            mx={2}
            mb={0.5}
            px={3}
            h={6}
            lineHeight={6}
            borderRadius={10}
            fontSize={12}
            color={
              location.pathname.startsWith("/main/transfer-list")
                ? "white"
                : "whiteAlpha.700"
            }
            bg={
              location.pathname.startsWith("/main/transfer-list")
                ? "rgba(0, 0, 0, 0.15)"
                : ""
            }
            _hover={{
              color: "white",
              bg: location.pathname.startsWith("/main/transfer-list")
                ? "rgba(0, 0, 0, 0.15)"
                : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <Box d={"flex"} alignItems={"center"} h={6}>
              <ListIcon as={AiOutlineDownload} />
              传输列表
            </Box>
          </ListItem>
          <ListItem
            onClick={() => jump("/main/transfer-done")}
            cursor={"pointer"}
            mx={2}
            px={3}
            h={6}
            lineHeight={6}
            borderRadius={10}
            fontSize={12}
            color={
              location.pathname.startsWith("/main/transfer-done")
                ? "white"
                : "whiteAlpha.700"
            }
            bg={
              location.pathname.startsWith("/main/transfer-done")
                ? "rgba(0, 0, 0, 0.15)"
                : ""
            }
            _hover={{
              color: "white",
              bg: location.pathname.startsWith("/main/transfer-done")
                ? "rgba(0, 0, 0, 0.15)"
                : "rgba(0, 0, 0, 0.05)",
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
        <HStack fontSize={14} px={4} mb={2.5}>
          <Text color={"whiteAlpha.700"}>设置</Text>
        </HStack>
        <List>
          <ListItem
            onClick={() => jump("/main/settings")}
            cursor={"pointer"}
            mx={2}
            px={3}
            h={6}
            mb={0.5}
            lineHeight={6}
            borderRadius={10}
            fontSize={12}
            color={
              location.pathname.startsWith("/main/settings")
                ? "white"
                : "whiteAlpha.700"
            }
            bg={
              location.pathname.startsWith("/main/settings")
                ? "rgba(0, 0, 0, 0.15)"
                : ""
            }
            _hover={{
              color: "white",
              bg: location.pathname.startsWith("/main/settings")
                ? "rgba(0, 0, 0, 0.15)"
                : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <Box d={"flex"} alignItems={"center"} h={6}>
              <ListIcon as={IoSettingsOutline} />
              设置
            </Box>
          </ListItem>
          <ListItem
            onClick={() => jump("/main/apps")}
            cursor={"pointer"}
            mx={2}
            px={3}
            h={6}
            lineHeight={6}
            borderRadius={10}
            fontSize={12}
            color={
              location.pathname.startsWith("/main/apps")
                ? "white"
                : "whiteAlpha.700"
            }
            bg={
              location.pathname.startsWith("/main/apps")
                ? "rgba(0, 0, 0, 0.15)"
                : ""
            }
            _hover={{
              color: "white",
              bg: location.pathname.startsWith("/main/apps")
                ? "rgba(0, 0, 0, 0.15)"
                : "rgba(0, 0, 0, 0.05)",
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
  );
};

export default SideBar;
