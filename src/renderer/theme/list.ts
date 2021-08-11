import { ComponentStyleConfig } from "@chakra-ui/react";

const List: ComponentStyleConfig = {
  parts: ["list", "item"],
  baseStyle: {},
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
    sidebar: {
      item: {
        cursor: "pointer",
        mx: 2,
        px: 3,
        h: 6,
        lineHeight: 6,
        borderRadius: 10,
        fontSize: 12,
        color: "whiteAlpha.700",
        _hover: {
          color: "white",
          bg: "rgba(0, 0, 0, 0.05)",
        },
      },
    },
  },
  defaultProps: {
    size: "xs",
  },
};

export default List;
