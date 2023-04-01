import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { resolve } from "path";
import eslint from "@rollup/plugin-eslint";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  build: {
    target: "es2015",
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html")
      }
    },
    outDir: resolve(__dirname, "dist/electron")
  },
  resolve: {
    alias: {
      main: resolve(__dirname, "src/main"),
      renderer: resolve(__dirname, "src/renderer"),
      types: resolve(__dirname, "src/types")
    }
  }
});
