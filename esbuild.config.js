const { resolve } = require("path");

require("dotenv").config({
  path: resolve(__dirname, `.env.${process.env.NODE_ENV}`)
});

require("esbuild").buildSync({
  entryPoints: [resolve(__dirname, "./src/main/index.ts")],
  bundle: true,
  platform: "node",
  sourcemap: true,
  target: ["node10.4"],
  external: ["electron"],
  define: {},
  outdir: resolve(__dirname, "./dist/main"),
  loader: { ".png": "file" }
});
