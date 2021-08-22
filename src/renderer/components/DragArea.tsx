import React, { FC } from "react";
import { Box } from "@chakra-ui/react";

const DragArea: FC = () => (
  <Box pos="fixed" w="100%" h={10} className="app-region" />
);

export default DragArea;
