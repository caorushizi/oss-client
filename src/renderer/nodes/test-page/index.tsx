import React, { FC } from "react";
import "./index.scss";
import { Button } from "@chakra-ui/react";

const TestPage: FC = () => {
  return (
    <div className={"test-page"}>
      <Button>测试1</Button>
    </div>
  );
};

export default TestPage;
