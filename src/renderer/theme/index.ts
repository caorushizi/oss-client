import { extendTheme } from "@chakra-ui/react";
import Button from "./button";

const theme = extendTheme({
  components: {
    Button,
  },
  styles: {
    global: {
      "*": {
        color: "white",
        lineHeight: "tall",
        fontFamily: "Alibaba-PuHuiTi-Regular",
      },
    },
  },
});

export default theme;
