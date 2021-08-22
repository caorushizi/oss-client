import { ComponentStyleConfig } from "@chakra-ui/react";

const Select: ComponentStyleConfig = {
  baseStyle: {},
  sizes: {
    sm: {
      field: {},
    },
  },
  variants: {
    oss: {
      field: {
        borderRadius: 5,
        bg: "rgba(0, 0, 0, 0.15)",
        color: "white",
        "> option, > optgroup": {
          color: "black",
        },
      },
      icon: {
        color: "white",
      },
    },
  },
  defaultProps: {
    size: "xs",
    variant: "oss",
  },
};

export default Select;
