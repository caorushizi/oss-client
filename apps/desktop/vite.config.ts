import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react({ compiler: true }), tailwindcss()],
  clearScreen: false,
  server: {
    port: 7789,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
