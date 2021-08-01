import { extendTheme } from "@chakra-ui/react";
import Button from "./button";

const theme = extendTheme({
  components: {
    Button,
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
