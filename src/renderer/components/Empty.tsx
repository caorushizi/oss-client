import React, { FC } from "react";
import { Center, Text, VStack } from "@chakra-ui/react";

interface Props {
  title?: string;
  subTitle?: string;
}

const Empty: FC<Props> = (props) => {
  const { title, subTitle } = props;
  return (
    <Center h={"100%"}>
      <VStack>
        <Text fontSize={25} color={"white"}>
          {title}
        </Text>
        <Text fontSize={15} color={"whiteAlpha.500"}>
          {subTitle}
        </Text>
      </VStack>
    </Center>
  );
};

Empty.defaultProps = {
  title: "暂无数据",
  subTitle: "请输入详细描述",
};

export default Empty;
