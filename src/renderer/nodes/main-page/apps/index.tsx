import React, { FC } from "react";
import MainSection from "../elements/MainSection";
import {
  Box,
  Button,
  Flex,
  Heading,
  List,
  ListIcon,
  ListItem,
  useDisclosure,
} from "@chakra-ui/react";
import { MdCheckCircle } from "react-icons/all";
import { useSelector } from "react-redux";
import { AppState } from "../../../store/reducers";
import { OssState } from "../../../store/reducers/oss.reducer";
import AddS3App from "./elements/AddS3App";
import EditS3App from "./elements/EditS3App";

// app 的列表
const Apps: FC = () => {
  const app = useSelector<AppState, OssState>((state) => state.app);
  const activeApp = app.apps.find((i) => i.name === app.active);
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <MainSection>
      <Flex>
        <Box w={56} px={3}>
          <Button size={"xs"} fontSize={12} onClick={onOpen}>
            添加
          </Button>
          <List spacing={2} mt={4}>
            {app.apps.map((item) => (
              <ListItem
                cursor={"pointer"}
                px={3}
                borderRadius={10}
                fontSize={12}
                color={app.active === item.name ? "white" : "whiteAlpha.700"}
                bg={app.active === item.name ? "rgba(0, 0, 0, 0.15)" : ""}
                _hover={{
                  color: "white",
                  bg:
                    app.active === item.name
                      ? "rgba(0, 0, 0, 0.15)"
                      : "rgba(0, 0, 0, 0.05)",
                }}
              >
                <Box d={"flex"} alignItems={"center"} h={6}>
                  <ListIcon as={MdCheckCircle} color="green.500" />
                  {item.name}
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
        <Box flex={1} px={3}>
          <Heading>编辑</Heading>
          {activeApp && <EditS3App app={activeApp} />}
          <AddS3App isOpen={isOpen} onClose={onClose} />
        </Box>
      </Flex>
    </MainSection>
  );
};

export default Apps;
