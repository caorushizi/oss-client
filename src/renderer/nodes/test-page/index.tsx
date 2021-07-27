import React, { FC } from "react";
import "./index.scss";
import { Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const TestPage: FC = () => {
  const navigate = useNavigate();

  return (
    <div className={"test-page"}>
      <Button
        onClick={() => {
          navigate("/main");
        }}
      >
        回首页
      </Button>
    </div>
  );
};

export default TestPage;
