import { ComponentStyleConfig } from "@chakra-ui/react";

const Button: ComponentStyleConfig = {
  baseStyle: {
    fontWeight: "bold",
    textTransform: "uppercase",
    borderRadius: "base",
    bg: "whiteAlpha.300",
    borderColor: "white",
    borderWidth: 1,
    color: "white",
    fontFamily: "Alibaba-PuHuiTi-Light",
    fontSize: 12,
    _hover: { bg: "whiteAlpha.400" },
    _focus: {
      boxShadow:
        "0 0 1px 1px rgba(255, 255, 255, .75), 0 1px 1px rgba(0, 0, 0, .15)",
    },
  },
  sizes: {
    xs: {
      fontSize: "sm",
      px: 4,
      py: 3,
      borderRadius: 8,
      fontWeight: "600",
    },
  },
  variants: {
    outline: {
      border: "1px solid",
      borderColor: "white.500",
      color: "white",
    },
    solid: {
      bg: "purple.500",
      color: "white",
    },
  },
  defaultProps: {
    size: "xs",
    variant: "outline",
  },
};

export default Button;
