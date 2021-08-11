import { extendTheme } from "@chakra-ui/react";
import Button from "./button";
import List from "./list";

const theme = extendTheme({
  components: {
    Button,
    List,
  },
  styles: {
    global: {
      "*": {
        lineHeight: "tall",
        fontFamily: "Alibaba-PuHuiTi-Regular",
      },
    },
  },
});

export default theme;
