import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  build: {
    target: "es2015",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "main-window.html"),
        alert: resolve(__dirname, "alert-window.html"),
        float: resolve(__dirname, "float-window.html"),
        confirm: resolve(__dirname, "confirm-window.html")
      }
    },
    outDir: resolve(__dirname, "dist/electron")
  }
});
