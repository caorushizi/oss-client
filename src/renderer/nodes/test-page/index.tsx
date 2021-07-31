import React, { FC } from "react";
import "./index.scss";
import { Button } from "@chakra-ui/react";

const TestPage: FC = () => {
  return (
    <div className={"test-page"}>
      <Button onClick={() => {}}>回首页</Button>
    </div>
  );
};

export default TestPage;
