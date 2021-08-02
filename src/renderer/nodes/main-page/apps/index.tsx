import React, { FC } from "react";
import MainSection from "../elements/MainSection";
import { Box, Button, Flex, List, ListIcon, ListItem } from "@chakra-ui/react";
import { MdCheckCircle } from "react-icons/all";

const Apps: FC = () => {
  return (
    <MainSection>
      <Flex>
        <Box w={56} px={3}>
          <Button
            h={6}
            bg={"whiteAlpha.300"}
            borderRadius={8}
            borderColor={"white"}
            borderWidth={1}
            color={"white"}
            fontFamily={"Alibaba-PuHuiTi-Light"}
            fontWeight={600}
            fontSize={12}
            _hover={{ bg: "whiteAlpha.400" }}
            _focus={{
              boxShadow:
                "0 0 1px 1px rgba(255, 255, 255, .75), 0 1px 1px rgba(0, 0, 0, .15)",
            }}
          >
            添加
          </Button>
          <List spacing={2} mt={4}>
            <ListItem
              cursor={"pointer"}
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
                <ListIcon as={MdCheckCircle} color="green.500" />
                Assumenda
              </Box>
            </ListItem>
            <ListItem
              cursor={"pointer"}
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
                <ListIcon as={MdCheckCircle} color="green.500" />
                Assumenda
              </Box>
            </ListItem>
            <ListItem
              cursor={"pointer"}
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
                <ListIcon as={MdCheckCircle} color="green.500" />
                Assumenda
              </Box>
            </ListItem>
          </List>
        </Box>
        <Box>123</Box>
      </Flex>
    </MainSection>
  );
};

export default Apps;
