import { extendTheme } from "@chakra-ui/react";
import Button from "./button";
import List from "./list";
import Input from "./input";
import Select from "./select";

const theme = extendTheme({
  components: {
    Button,
    List,
    Input,
    Select,
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
