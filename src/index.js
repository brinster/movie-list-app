// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {
  ChakraProvider,
  extendTheme,
  ColorModeScript,
} from "@chakra-ui/react";

// Extend Chakra theme
const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },

  fonts: {
    heading: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
  },

  styles: {
    global: {
      body: {
        bg: "gray.900",
        color: "gray.100",
        fontWeight: "400",
        letterSpacing: "-0.01em",
      },
    },
  },

  components: {
    Button: {
      baseStyle: {
        fontWeight: "600",
        borderRadius: "md",
      },
      sizes: {
        md: {
          px: 5,
          py: 5,
        },
      },
    },

    Table: {
      baseStyle: {
        th: {
          fontWeight: "600",
          letterSpacing: "0.02em",
        },
      },
    },

    Input: {
      baseStyle: {
        field: {
          borderRadius: "md",
        },
      },
    },

    Select: {
      baseStyle: {
        field: {
          borderRadius: "md",
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <ChakraProvider theme={theme}>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <App />
  </ChakraProvider>
);