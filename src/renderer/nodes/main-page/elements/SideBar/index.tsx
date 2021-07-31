import React, { FC } from "react";
import { List, ListItem } from "@chakra-ui/react";

type Props = {
  jump: (path: string) => void;
};

const SideBar: FC<Props> = (props) => {
  const { jump } = props;
  return (
    <List>
      <ListItem mb={6}>
        储存空间
        <List>
          <ListItem onClick={() => jump("/main/bucket")}>bucket</ListItem>
        </List>
      </ListItem>
      <ListItem mb={6}>
        传输列表
        <List>
          <ListItem onClick={() => jump("/main/transfer-list")}>
            传输列表
          </ListItem>
          <ListItem onClick={() => jump("/main/transfer-done")}>
            传输完成
          </ListItem>
        </List>
      </ListItem>
      <ListItem>
        设置
        <List>
          <ListItem onClick={() => jump("/main/settings")}>设置</ListItem>
          <ListItem onClick={() => jump("/main/apps")}>apps</ListItem>
        </List>
      </ListItem>
    </List>
  );
};

export default SideBar;
