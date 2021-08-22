import { ComponentStyleConfig } from "@chakra-ui/react";

const Input: ComponentStyleConfig = {
  baseStyle: {
    field: {
      _placeholder: { color: "whiteAlpha.700" },
    },
  },
  sizes: {
    xs: {
      field: {
        borderRadius: 5,
      },
    },
  },
  variants: {
    "oss-1": {
      field: {
        bg: "rgba(0, 0, 0, 0.15)",
        color: "white",
      },
    },
  },
  defaultProps: {
    size: "xs",
    variant: "oss-1",
  },
};

export default Input;
