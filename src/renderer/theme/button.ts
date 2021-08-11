import { ComponentStyleConfig } from "@chakra-ui/react";

const Button: ComponentStyleConfig = {
  baseStyle: {
    textTransform: "uppercase",
    borderRadius: "base",
    bg: "whiteAlpha.300",
    borderWidth: 1,
    fontFamily: "Alibaba-PuHuiTi-Light",
    fontSize: 12,
    _hover: { bg: "whiteAlpha.400" },
    _focus: {
      boxShadow:
        "0 0 1px 1px rgba(255, 255, 255, .75), 0 1px 1px rgba(0, 0, 0, .15)",
    },
    border: "1px solid",
    borderColor: "white.500",
    color: "white",
  },
  sizes: {
    xs: {
      fontSize: "sm",
      px: 4,
      py: 3,
      borderRadius: 8,
    },
  },
  variants: {},
  defaultProps: {
    size: "xs",
  },
};

export default Button;
