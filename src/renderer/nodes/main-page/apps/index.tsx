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
  useStyleConfig,
} from "@chakra-ui/react";
import { MdCheckCircle } from "react-icons/all";
import { useSelector } from "react-redux";
import { AppState } from "../../../store/reducers";
import { OssState } from "../../../store/reducers/oss.reducer";
import AddS3App from "./elements/AddS3App";
import EditS3App from "./elements/EditS3App";
import Empty from "components/Empty";

// app 的列表
const Apps: FC = () => {
  const app = useSelector<AppState, OssState>((state) => state.app);
  const activeApp = app.apps.find((i) => i.name === app.active);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const styles = useStyleConfig("SidebarItem");
  console.log("styles", styles);

  return (
    <MainSection>
      {app.apps.length > 0 ? (
        <Flex>
          <Box w={56} px={3}>
            <Button size={"xs"} fontSize={12} onClick={onOpen}>
              添加
            </Button>
            <List spacing={2} mt={4} variant={"sidebar"}>
              {app.apps.map((item) => (
                <ListItem
                  key={item.name}
                  color={item.name === app.active ? "white" : undefined}
                  bg={
                    item.name === app.active ? "rgba(0, 0, 0, 0.15)" : undefined
                  }
                  _hover={{
                    bg:
                      item.name === app.active
                        ? "rgba(0, 0, 0, 0.15)"
                        : undefined,
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
          </Box>
        </Flex>
      ) : (
        <Empty extra={<Button onClick={onOpen}>添加</Button>} />
      )}
      <AddS3App isOpen={isOpen} onClose={onClose} />
    </MainSection>
  );
};

export default Apps;
