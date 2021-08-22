import { ComponentStyleConfig } from "@chakra-ui/react";

const Button: ComponentStyleConfig = {
  baseStyle: {
    textTransform: "uppercase",
    borderRadius: "base",
  },
  sizes: {
    xs: {
      borderRadius: 5,
    },
  },
  variants: {
    oss: {
      fontFamily: "Alibaba-PuHuiTi-Light",
      bg: "whiteAlpha.100",
      border: "1px solid",
      borderColor: "white.500",
      color: "white",
      fontSize: 12,
      _hover: { bg: "whiteAlpha.400" },
      _focus: { boxShadow: "0 0 1px 1px rgba(255, 255, 255, .75)" },
    },
  },
  defaultProps: {
    size: "xs",
    variant: "oss",
  },
};

export default Button;
