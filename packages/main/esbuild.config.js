const { resolve } = require("path");

require("dotenv").config({
  path: resolve(__dirname, `.env.${process.env.NODE_ENV}`)
});

require("esbuild").buildSync({
  entryPoints: [resolve(__dirname, "./src/index.ts")],
  bundle: true,
  platform: "node",
  sourcemap: true,
  target: ["node10.4"],
  external: ["electron"],
  define: {
    "process.env.NODE_ENV":
      process.env.NODE_ENV === "production" ? '"production"' : '"development"'
  },
  outdir: resolve(__dirname, "./build/main"),
  loader: { ".png": "file" }
});
